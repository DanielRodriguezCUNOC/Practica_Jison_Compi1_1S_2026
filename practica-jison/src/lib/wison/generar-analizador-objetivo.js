// Este módulo se encarga de transformar un AST de Wison a una gramática Jison y compilarla.

// Obtiene el constructor compatible desde el modulo jison.
function obtenerFabricaParser(jisonModule) {
	const Jison = jisonModule?.default ?? jisonModule;
	const parserFactory = Jison?.Parser ?? Jison?.Generator ?? Jison;

	if (typeof parserFactory !== 'function') {
		throw new Error('El paquete jison no expone un constructor compatible.');
	}

	return parserFactory;
}

// Cremos una clase como si fuera Java XD
// El constructor recibe el AST de Wison y se encarga de generar la gramática Jison a partir de ese AST. Luego, se puede compilar esa gramática para obtener un parser ejecutable.
class GeneradorAnalizadorObjetivo {
	constructor(ast) {
		this.ast = ast;
		this.mapaTerminales = {};
		this.mapaNoTerminales = {};
		this.terminalesPorId = {};
	}

	// Punto de entrada principal del generador.
	generarGramaticaJison() {
		this.construirMapasDeSimbolos();
		const simboloInicial = this.obtenerSimboloInicialMapeado();

		const reglasLex = this.construirReglasLex();
		const reglasSintacticas = this.construirReglasSintacticas();
		const partes = this.construirPartesDeGramatica(simboloInicial, reglasLex, reglasSintacticas);
		return partes.join('\n');
	}

	// Obtiene el simbolo inicial mapeado a NT_.
	obtenerSimboloInicialMapeado() {
		const simboloInicialOriginal = this.ast?.syntax?.startSymbol;
		const simboloInicial = this.mapaNoTerminales[simboloInicialOriginal];
		if (!simboloInicial) {
			throw new Error('No se encontro el simbolo inicial de la gramatica objetivo.');
		}

		return simboloInicial;
	}

	// Arma todas las partes del archivo .jison final.
	construirPartesDeGramatica(simboloInicial, reglasLex, reglasSintacticas) {
		const partes = [];
		partes.push('%lex');
		partes.push('%%');
		partes.push(reglasLex);
		partes.push('/lex');
		partes.push('');
		partes.push(`%start ${simboloInicial}`);
		partes.push('');
		partes.push('%%');
		partes.push(reglasSintacticas);

		return partes;
	}



	// Escapa texto para usarlo en acciones JS del parser.
	escaparParaTextoPlano(valor) {
		if (typeof valor !== 'string') {
			return '';
		}

		let resultado = '';
		for (let i = 0; i < valor.length; i += 1) {
			const caracter = valor.charAt(i);
			if (caracter === '\\') {
				resultado += '\\\\';
			} else if (caracter === "'") {
				resultado += "\\'";
			} else {
				resultado += caracter;
			}
		}

		return resultado;
	}

	// Escapa metacaracteres para construir reglas regex.
	escaparParaRegex(valor) {
		if (typeof valor !== 'string') {
			return '';
		}

		let resultado = '';
		for (let i = 0; i < valor.length; i += 1) {
			const caracter = valor.charAt(i);
			if ('\\^$.*+?()[]{}|'.indexOf(caracter) >= 0) {
				resultado += '\\' + caracter;
			} else {
				resultado += caracter;
			}
		}

		return resultado;
	}

	// Normaliza las clases especiales definidas en Wison.
	normalizarClase(valorOriginal) {
		if (typeof valorOriginal !== 'string') {
			return '[A-Za-z0-9_]';
		}

		const valor = valorOriginal.replace(/\s+/g, '');
		if (valor === '[aA-zZ]' || valor === '[a-zA-Z]') return '[A-Za-z]';
		if (valor === '[A-Z]') return '[A-Z]';
		if (valor === '[0-9]') return '[0-9]';

		return valor;
	}

	// Convierte ids de Wison a identificadores.
	normalizarIdentificador(nombre, prefijo, indice) {
		let resultado = '';
		const texto = String(nombre ?? '');

		for (let i = 0; i < texto.length; i += 1) {
			const caracter = texto.charAt(i);
			const esLetra = (caracter >= 'a' && caracter <= 'z') || (caracter >= 'A' && caracter <= 'Z');
			const esDigito = caracter >= '0' && caracter <= '9';
			if (esLetra || esDigito || caracter === '_') {
				resultado += caracter;
			} else {
				resultado += '_';
			}
		}

		if (resultado.length === 0) {
			resultado = `${prefijo}_${indice}`;
		}

		const primero = resultado.charAt(0);
		const iniciaConNumero = primero >= '0' && primero <= '9';
		if (iniciaConNumero) {
			resultado = `${prefijo}_${resultado}`;
		}

		return resultado;
	}

	// Crea mapa de terminales y no terminales estos mapas se usan para convertir los simbolos de Wison a nombres compatibles con Jison y evitar colisiones o caracteres invalidos en los nombres de tokens y no terminales.
	construirMapasDeSimbolos() {
		const terminales = Array.isArray(this.ast?.lex?.terminals) ? this.ast.lex.terminals : [];
		const noTerminales = Array.isArray(this.ast?.syntax?.nonTerminals) ? this.ast.syntax.nonTerminals : [];

		for (let i = 0; i < terminales.length; i += 1) {
			const terminal = terminales[i];
			if (!terminal?.id) continue;
      // Aqui van los terminales
			this.mapaTerminales[terminal.id] = `TOK_${this.normalizarIdentificador(terminal.id, 'T', i)}`;
		}

		for (let i = 0; i < noTerminales.length; i += 1) {
			const noTerminal = noTerminales[i];
			if (!noTerminal) continue;
      // Aqui van los no terminales
			this.mapaNoTerminales[noTerminal] = `NT_${this.normalizarIdentificador(noTerminal, 'N', i)}`;
		}
	}

	// Convierte un elemento lexico de AST a regex de Jison.
	convertirElementoARegex(elemento) {
		if (Array.isArray(elemento)) {
			return this.convertirGrupoARegex(elemento);
		}

		if (this.esElementoLiteral(elemento)) {
			return this.convertirLiteralARegex(elemento);
		}

		if (this.esElementoClaseCaracter(elemento)) {
			return this.convertirClaseCaracterARegex(elemento);
		}

		if (this.esElementoReferenciaTerminal(elemento)) {
			return this.convertirReferenciaTerminalARegex(elemento);
		}

		if (this.esElementoUnario(elemento)) {
			return this.convertirUnarioARegex(elemento);
		}

		throw new Error(`Tipo de elemento lexico no soportado: ${elemento.type}`);
	}



	// Identifica si el elemento es literal.
	esElementoLiteral(elemento) {
		return elemento.type === 'literal';
	}

	// Identifica clases de caracter especiales.
	esElementoClaseCaracter(elemento) {
		return elemento.type === 'alfanumerico' || elemento.type === 'numero';
	}

	// Identifica referencias a terminales declarados.
	esElementoReferenciaTerminal(elemento) {
		return elemento.type === 'terminal_ref';
	}

	// Identifica operadores unarios sobre un elemento base.
	esElementoUnario(elemento) {
		return elemento.type === 'unario';
	}

	// Convierte subexpresiones agrupadas.
	convertirGrupoARegex(grupo) {
		return `(?:${this.convertirExpresionARegex(grupo)})`;
	}

	// Convierte literal a regex escapado.
	convertirLiteralARegex(elemento) {
		return this.escaparParaRegex(elemento.value ?? '');
	}

	// Convierte clases especiales a expresion regular.
	convertirClaseCaracterARegex(elemento) {
		return this.normalizarClase(elemento.value);
	}

	// Convierte referencia de terminal.
	convertirReferenciaTerminalARegex(elemento) {
		const id = elemento.value;
		return `(?:${this.convertirExpresionARegex(this.terminalesPorId[id].expr ?? [])})`;
	}

	// Convierte operador unario aplicado al elemento base.
	convertirUnarioARegex(elemento) {
		const base = this.convertirElementoARegex(elemento.value);
		const operador = elemento.operator;
		if (operador !== '*' && operador !== '+' && operador !== '?') {
			throw new Error(`Operador lexico no soportado: ${operador}`);
		}
		return `(?:${base})${operador}`;
	}

	// Concatena una expresion lexica en expresion regular.
	convertirExpresionARegex(expresion) {
		const elementos = Array.isArray(expresion) ? expresion : [];
		let resultado = '';

		for (let i = 0; i < elementos.length; i += 1) {
			resultado += this.convertirElementoARegex(elementos[i]);
		}

		if (resultado.length === 0) {
			return '(?:)';
		}

		return resultado;
	}

	// Construye el bloque %lex del analizador objetivo.
	construirReglasLex() {
		const terminales = Array.isArray(this.ast?.lex?.terminals) ? this.ast.lex.terminals : [];
		this.prepararTerminalesPorId(terminales);

		const lineas = [];
		lineas.push('\t\\s+                              /* ignorar espacios en blanco */');

		for (let i = 0; i < terminales.length; i += 1) {
			const terminal = terminales[i];
			if (!terminal?.id) continue;

			const token = this.mapaTerminales[terminal.id];
			const regex = this.convertirExpresionARegex(terminal.expr ?? []);
			lineas.push(`\t${regex}                              return '${token}';`);
		}

		lineas.push("\t<<EOF>>                          return 'EOF';");
		lineas.push('\t.                                { throw new Error(\'Token no reconocido: \'+ yytext); }');

		return lineas.join('\n');
	}

	// Prepara un indice de terminales por id para resolver referencias.
	prepararTerminalesPorId(terminales) {
		this.terminalesPorId = {};

		const lista = Array.isArray(terminales) ? terminales : [];
		for (let i = 0; i < lista.length; i += 1) {
			const terminal = lista[i];
			if (terminal?.id) {
				this.terminalesPorId[terminal.id] = terminal;
			}
		}
	}

	// Convierte simbolos de produccion a nombres mapeados.
	convertirSimboloProduccion(simbolo) {
		if (!simbolo || typeof simbolo !== 'object') {
			throw new Error('Simbolo de produccion invalido.');
		}

		if (simbolo.kind === 'idTerminal') {
			const token = this.mapaTerminales[simbolo.value];
			if (!token) {
				throw new Error(`Terminal no declarado en produccion: ${simbolo.value}`);
			}
			return token;
		}

		if (simbolo.kind === 'idNonTerminal') {
			const noTerminal = this.mapaNoTerminales[simbolo.value];
			if (!noTerminal) {
				throw new Error(`No terminal no declarado en produccion: ${simbolo.value}`);
			}
			return noTerminal;
		}

		throw new Error(`Tipo de simbolo no soportado en produccion: ${simbolo.kind}`);
	}



	// Construye las reglas sintacticas del bloque de gramatica.
	construirReglasSintacticas() {
		const agrupadas = this.agruparProduccionesPorNoTerminal();
		const noTerminales = Object.keys(agrupadas);
		const bloques = [];

		for (let i = 0; i < noTerminales.length; i += 1) {
			const lhsOriginal = noTerminales[i];
			bloques.push(this.construirBloqueNoTerminal(lhsOriginal, agrupadas[lhsOriginal]));
		}

		return bloques.join('\n\n');
	}

	// Agrupa producciones por no terminal izquierdo.
	agruparProduccionesPorNoTerminal() {
		const producciones = Array.isArray(this.ast?.syntax?.productions) ? this.ast.syntax.productions : [];
		const agrupadas = {};

		for (let i = 0; i < producciones.length; i += 1) {
			const produccion = producciones[i];
			if (!produccion?.lhs) continue;

			if (!agrupadas[produccion.lhs]) {
				agrupadas[produccion.lhs] = [];
			}

			const alternativas = Array.isArray(produccion.rhs) ? produccion.rhs : [];
			for (let j = 0; j < alternativas.length; j += 1) {
				agrupadas[produccion.lhs].push(alternativas[j]);
			}
		}

		return agrupadas;
	}

	// Arma el bloque completo de un no terminal.
	construirBloqueNoTerminal(lhsOriginal, alternativas) {
		const lhs = this.mapaNoTerminales[lhsOriginal];
		if (!lhs) {
			throw new Error(`No terminal sin declaracion en sintaxis: ${lhsOriginal}`);
		}

		const lineasAlternativas = this.construirLineasAlternativas(lhsOriginal, alternativas);
		return `${lhs}\n\t: ${lineasAlternativas.join('\n\t| ')}\n\t;`;
	}

	// Convierte alternativas a lineas jison sin acciones semanticas.
	construirLineasAlternativas(lhsOriginal, alternativas) {
		const lineas = [];
		const lista = Array.isArray(alternativas) ? alternativas : [];

		for (let j = 0; j < lista.length; j += 1) {
			const secuenciaMapeada = this.mapearSecuenciaProduccion(lista[j]);
			const cuerpo = secuenciaMapeada.length > 0 ? secuenciaMapeada.join(' ') : '/* empty */';
			lineas.push(`	${cuerpo}`);
		}

		return lineas;
	}

	// Mapea una secuencia de simbolos al vocabulario del parser objetivo.
	mapearSecuenciaProduccion(secuenciaOriginal) {
		const secuencia = Array.isArray(secuenciaOriginal) ? secuenciaOriginal : [];
		const secuenciaMapeada = [];

		for (let k = 0; k < secuencia.length; k += 1) {
			secuenciaMapeada.push(this.convertirSimboloProduccion(secuencia[k]));
		}

		return secuenciaMapeada;
	}


}

// Genera el texto final .jison a partir del AST Wison.
export function generarGramaticaJisonObjetivo(ast) {
	const generador = new GeneradorAnalizadorObjetivo(ast);
	return generador.generarGramaticaJison();
}

// Compila la gramatica objetivo y retorna parser ejecutable.
export async function compilarAnalizadorObjetivoDesdeAst(ast) {
	const gramaticaJison = generarGramaticaJisonObjetivo(ast);
	const jisonModule = await import('jison');
	const FabricaParser = obtenerFabricaParser(jisonModule);
	const parserInstancia = new FabricaParser(gramaticaJison);

	if (typeof parserInstancia.parse !== 'function') {
		throw new Error('No se pudo crear una instancia de parser ejecutable.');
	}

	return {
		gramaticaJison,
		parserInstancia
	};
}
