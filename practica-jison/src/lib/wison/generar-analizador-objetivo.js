// Genera el analizador objetivo usando Jison.

// Obtiene el constructor compatible desde el modulo jison.
function obtenerFabricaParser(jisonModule) {
	const Jison = jisonModule?.default ?? jisonModule;
	const parserFactory = Jison?.Parser ?? Jison?.Generator ?? Jison;

	if (typeof parserFactory !== 'function') {
		throw new Error('El paquete jison no expone un constructor compatible.');
	}

	return parserFactory;
}

// Escapa texto para usarlo en acciones JS del parser.
function escaparParaTextoPlano(valor) {
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
function escaparParaRegex(valor) {
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
function normalizarClase(valorOriginal) {
	if (typeof valorOriginal !== 'string') {
		return '[A-Za-z0-9_]';
	}

	const valor = valorOriginal.replace(/\s+/g, '');
	if (valor === '[aA-zZ]' || valor === '[a-zA-Z]') return '[A-Za-z]';
	if (valor === '[A-Z]') return '[A-Z]';
	if (valor === '[0-9]') return '[0-9]';

	return valor;
}

// Convierte ids de Wison a identificadores seguros.
function normalizarIdentificador(nombre, prefijo, indice) {
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

// Crea mapa de terminales y no terminales renombrados.
function construirMapasDeSimbolos(ast) {
	const terminales = Array.isArray(ast?.lex?.terminals) ? ast.lex.terminals : [];
	const noTerminales = Array.isArray(ast?.syntax?.nonTerminals) ? ast.syntax.nonTerminals : [];

	const mapaTerminales = {};
	const mapaNoTerminales = {};

	for (let i = 0; i < terminales.length; i += 1) {
		const terminal = terminales[i];
		if (!terminal?.id) continue;
		mapaTerminales[terminal.id] = `TOK_${normalizarIdentificador(terminal.id, 'T', i)}`;
	}

	for (let i = 0; i < noTerminales.length; i += 1) {
		const noTerminal = noTerminales[i];
		if (!noTerminal) continue;
		mapaNoTerminales[noTerminal] = `NT_${normalizarIdentificador(noTerminal, 'N', i)}`;
	}

	return { mapaTerminales, mapaNoTerminales };
}

// Convierte un elemento lexico de AST a regex de Jison.
function convertirElementoARegex(elemento, terminalesPorId, visitados) {
	if (Array.isArray(elemento)) {
		return `(?:${convertirExpresionARegex(elemento, terminalesPorId, visitados)})`;
	}

	if (!elemento || typeof elemento !== 'object') {
		throw new Error('Elemento lexico invalido en declaracion de terminal.');
	}

	if (elemento.type === 'literal') {
		return escaparParaRegex(elemento.value ?? '');
	}

	if (elemento.type === 'alfanumerico' || elemento.type === 'numero') {
		return normalizarClase(elemento.value);
	}

	if (elemento.type === 'terminal_ref') {
		const id = elemento.value;
		if (!terminalesPorId[id]) {
			throw new Error(`La referencia de terminal ${id} no fue declarada.`);
		}

		if (visitados[id]) {
			throw new Error(`Se detecto una referencia circular en terminales: ${id}.`);
		}

		const nuevosVisitados = { ...visitados, [id]: true };
		return `(?:${convertirExpresionARegex(terminalesPorId[id].expr ?? [], terminalesPorId, nuevosVisitados)})`;
	}

	if (elemento.type === 'unario') {
		const base = convertirElementoARegex(elemento.value, terminalesPorId, visitados);
		const operador = elemento.operator;
		if (operador !== '*' && operador !== '+' && operador !== '?') {
			throw new Error(`Operador lexico no soportado: ${operador}`);
		}
		return `(?:${base})${operador}`;
	}

	throw new Error(`Tipo de elemento lexico no soportado: ${elemento.type}`);
}

// Concatena una expresion lexica completa en regex.
function convertirExpresionARegex(expresion, terminalesPorId, visitados = {}) {
	const elementos = Array.isArray(expresion) ? expresion : [];
	let resultado = '';

	for (let i = 0; i < elementos.length; i += 1) {
		resultado += convertirElementoARegex(elementos[i], terminalesPorId, visitados);
	}

	if (resultado.length === 0) {
		return '(?:)';
	}

	return resultado;
}

// Construye el bloque %lex del analizador objetivo.
function construirReglasLex(ast, mapaTerminales) {
	const terminales = Array.isArray(ast?.lex?.terminals) ? ast.lex.terminals : [];
	const terminalesPorId = {};

	for (let i = 0; i < terminales.length; i += 1) {
		const terminal = terminales[i];
		if (terminal?.id) {
			terminalesPorId[terminal.id] = terminal;
		}
	}

	const lineas = [];
	lineas.push('\t\\s+                              /* ignorar espacios en blanco */');

	for (let i = 0; i < terminales.length; i += 1) {
		const terminal = terminales[i];
		if (!terminal?.id) continue;

		const token = mapaTerminales[terminal.id];
		const regex = convertirExpresionARegex(terminal.expr ?? [], terminalesPorId, { [terminal.id]: true });
		lineas.push(`\t${regex}                              return '${token}';`);
	}

	lineas.push("\t<<EOF>>                          return 'EOF';");
	lineas.push('\t.                                { throw new Error(\'Token no reconocido: \'+ yytext); }');

	return lineas.join('\n');
}

// Convierte simbolos de produccion a nombres mapeados.
function convertirSimboloProduccion(simbolo, mapaTerminales, mapaNoTerminales) {
	if (!simbolo || typeof simbolo !== 'object') {
		throw new Error('Simbolo de produccion invalido.');
	}

	if (simbolo.kind === 'idTerminal') {
		const token = mapaTerminales[simbolo.value];
		if (!token) {
			throw new Error(`Terminal no declarado en produccion: ${simbolo.value}`);
		}
		return token;
	}

	if (simbolo.kind === 'idNonTerminal') {
		const noTerminal = mapaNoTerminales[simbolo.value];
		if (!noTerminal) {
			throw new Error(`No terminal no declarado en produccion: ${simbolo.value}`);
		}
		return noTerminal;
	}

	throw new Error(`Tipo de simbolo no soportado en produccion: ${simbolo.kind}`);
}

// Crea la accion semantica para construir nodos del arbol.
function construirAccionProduccion(lhsOriginal, secuencia) {
	if (!Array.isArray(secuencia) || secuencia.length === 0) {
		return "$$ = yy.crearNodo('LAMBDA', []);";
	}

	const referencias = [];
	for (let i = 0; i < secuencia.length; i += 1) {
		referencias.push(`$${i + 1}`);
	}

	const etiqueta = escaparParaTextoPlano(lhsOriginal);
	return `$$ = yy.crearNodo('${etiqueta}', [${referencias.join(', ')}]);`;
}

// Construye las reglas sintacticas del bloque de gramatica.
function construirReglasSintacticas(ast, mapaTerminales, mapaNoTerminales) {
	const producciones = Array.isArray(ast?.syntax?.productions) ? ast.syntax.productions : [];
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

	const noTerminales = Object.keys(agrupadas);
	const bloques = [];

	for (let i = 0; i < noTerminales.length; i += 1) {
		const lhsOriginal = noTerminales[i];
		const lhs = mapaNoTerminales[lhsOriginal];
		if (!lhs) {
			throw new Error(`No terminal sin declaracion en sintaxis: ${lhsOriginal}`);
		}

		const alternativas = agrupadas[lhsOriginal];
		const lineasAlternativas = [];

		for (let j = 0; j < alternativas.length; j += 1) {
			const secuenciaOriginal = Array.isArray(alternativas[j]) ? alternativas[j] : [];
			const secuenciaMapeada = [];

			for (let k = 0; k < secuenciaOriginal.length; k += 1) {
				secuenciaMapeada.push(
					convertirSimboloProduccion(secuenciaOriginal[k], mapaTerminales, mapaNoTerminales)
				);
			}

			const cuerpo = secuenciaMapeada.length > 0 ? secuenciaMapeada.join(' ') : '/* empty */';
			const accion = construirAccionProduccion(lhsOriginal, secuenciaMapeada);
			lineasAlternativas.push(`\t${cuerpo} { ${accion} }`);
		}

		bloques.push(`${lhs}\n\t: ${lineasAlternativas.join('\n\t| ')}\n\t;`);
	}

	return bloques.join('\n\n');
}

// Inyecta helpers de construccion de nodos en el parser.
function construirAyudantesParser() {
	return `%{\nlet contadorNodoGenerado = 0;\n\nfunction crearHoja(valor) {\n\treturn {\n\t\tid: 'n_' + (contadorNodoGenerado++),\n\t\tlabel: String(valor),\n\t\tchildren: []\n\t};\n}\n\nyy.crearNodo = function crearNodo(etiqueta, hijos) {\n\tconst hijosNormalizados = [];\n\tconst lista = Array.isArray(hijos) ? hijos : [];\n\n\tfor (let i = 0; i < lista.length; i += 1) {\n\t\tconst item = lista[i];\n\t\tif (item && typeof item === 'object' && Array.isArray(item.children)) {\n\t\t\thijosNormalizados.push(item);\n\t\t} else {\n\t\t\thijosNormalizados.push(crearHoja(item));\n\t\t}\n\t}\n\n\treturn {\n\t\tid: 'n_' + (contadorNodoGenerado++),\n\t\tlabel: String(etiqueta),\n\t\tchildren: hijosNormalizados\n\t};\n};\n\nfunction reiniciarContadorNodos() {\n\tcontadorNodoGenerado = 0;\n}\n%}`;
}

// Genera el texto final .jison a partir del AST Wison.
export function generarGramaticaJisonObjetivo(ast) {
	if (!ast?.lex || !ast?.syntax) {
		throw new Error('El AST de Wison no contiene bloques lex/syntax validos.');
	}

	const { mapaTerminales, mapaNoTerminales } = construirMapasDeSimbolos(ast);
	const simboloInicialOriginal = ast?.syntax?.startSymbol;
	const simboloInicial = mapaNoTerminales[simboloInicialOriginal];

	if (!simboloInicial) {
		throw new Error('No se encontro el simbolo inicial de la gramatica objetivo.');
	}

	const reglasLex = construirReglasLex(ast, mapaTerminales);
	const reglasSintacticas = construirReglasSintacticas(ast, mapaTerminales, mapaNoTerminales);

	const partes = [];
	partes.push(construirAyudantesParser());
	partes.push('');
	partes.push('%lex');
	partes.push('%%');
	partes.push(reglasLex);
	partes.push('/lex');
	partes.push('');
	partes.push(`%start ${simboloInicial}`);
	partes.push('');
	partes.push('%%');
	partes.push(reglasSintacticas);

	return partes.join('\n');
}

// Compila la gramatica objetivo y retorna parser ejecutable.
export async function compilarAnalizadorObjetivoDesdeAst(ast) {
	const gramaticaJison = generarGramaticaJisonObjetivo(ast);
	const jisonModule = await import('jison');
	const FabricaParser = obtenerFabricaParser(jisonModule);
	const parserInstancia = new FabricaParser(gramaticaJison);

	if (typeof parserInstancia.parse !== 'function') {
		throw new Error('No se pudo crear una instancia de parser ejecutable.'); // Esto no deberia pasar si Jison funciona correctamente :p.
	}

	return {
		gramaticaJison,
		parserInstancia
	};
}

