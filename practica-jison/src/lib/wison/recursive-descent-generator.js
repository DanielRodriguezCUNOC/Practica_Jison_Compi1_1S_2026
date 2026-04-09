// Generador de parser descendente recursivo LL(1).
// Toma el AST y la tabla LL(1) y genera codigo JavaScript ejecutable.

class GeneradorParserDescendente {
	
	constructor(ast, tablaLl1) {
		// AST parseado de la configuracion Wison.
		this.ast = ast;
		// Tabla LL(1) con producciones por (no_terminal, terminal).
		this.tablaLl1 = tablaLl1;
		// Codigo fuente acumulado del parser generado.
		this.codigoGenerado = "";
		// Contador para nombres unicos de funciones y nodos.
		this.contadorIdNodo = 0;
	}

	// Obtiene el simbolo inicial de la gramatica.
	obtenerSimboloInicial() {
		const simboloInicial = this.ast?.syntax?.startSymbol;
		if (!simboloInicial) {
			throw new Error("No se definio el simbolo inicial en la gramatica.");
		}
		return simboloInicial;
	}

	// Genera un identificador unico para los nodos del arbol sintactico.
	generarIdNodo() {
		this.contadorIdNodo++;
		return "n_" + (this.contadorIdNodo - 1);
	}

	// Emite una linea de codigo con indentacion.
	emitir(linea, nivel = 1) {
		const indentacion = "\t".repeat(nivel);
		this.codigoGenerado += indentacion + linea + "\n";
	}

	// Emite la cabecera de la clase parser.
	emitirCabecera() {
		this.emitir("class ParserGenerado {", 0);
		this.emitir("", 0);
		this.emitir("constructor() {", 1);
		this.emitir("// Arreglo de tokens del lexer.", 2);
		this.emitir("this.tokens = [];", 2);
		this.emitir("// Indice actual en el arreglo de tokens.", 2);
		this.emitir("this.indice = 0;", 2);
		this.emitir("// Errores sintacticos encontrados.", 2);
		this.emitir("this.errores = [];", 2);
		this.emitir("// Contador para generar IDs unicos de nodos.", 2);
		this.emitir("this.contadorId = 0;", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Emite la descripcion de la gramatica como getter.
	emitirEstructuraGramatica() {
		this.emitir("get estructuraGramatica() {", 1);
		this.emitir("return `", 2);

// Obtiene producciones del AST y las formatea.
const producciones = this.ast?.syntax?.productions || [];
		for (let i = 0; i < producciones.length; i += 1) {
			const prod = producciones[i];
			const lhs = prod?.lhs || "?";
			const rhs = prod?.rhs || [];
			
			const lineas = [];
			for (let j = 0; j < rhs.length; j += 1) {
				const opciones = rhs[j] || [];
				let opcionStr = "";
				for (let k = 0; k < opciones.length; k += 1) {
					const simbolo = opciones[k];
					const valor = simbolo?.value || "?";
					opcionStr += valor + " ";
}
opcionStr = opcionStr.trim();
if (!opcionStr) {
opcionStr = "LAMBDA";
}
lineas.push(lhs + " <= " + opcionStr + ";");
}

for (let j = 0; j < lineas.length; j += 1) {
				this.codigoGenerado += "\t\t" + lineas[j] + "\n";
			}
		}
		
		this.emitir("`;", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Emite el metodo parse que inicia el analisis.
	emitirMetodoParse() {
		this.emitir("parse(tokensEntrada) {", 1);
		this.emitir("// Inicializa estado del parser.", 2);
		this.emitir("this.tokens = tokensEntrada;", 2);
		this.emitir("this.indice = 0;", 2);
		this.emitir("this.errores = [];", 2);
		this.emitir("this.contadorId = 0;", 2);
		this.emitir("", 2);
		
		const simboloInicial = this.obtenerSimboloInicial();
		this.emitir("// Inicia analisis desde el simbolo inicial.", 2);
		this.emitir("let raiz = this.terminalL_" + simboloInicial + "();", 2);
		this.emitir("let tokenFinal = this.obtenerToken();", 2);
		this.emitir("", 2);
		this.emitir("// Verifica que se haya consumido toda la entrada.", 2);
		this.emitir("if (tokenFinal.tipo !== 'EOF') {", 2);
		this.emitir("this.errores.push({lexema: 'EOF', tipo: 'Sintactico', mensaje: `Se esperaba EOF, pero se encontro ${tokenFinal.tipo}`, fila: tokenFinal.fila, columna: tokenFinal.columna });", 3);
		this.emitir("}", 2);
		this.emitir("", 2);
		this.emitir("// Retorna arbol y errores.", 2);
		this.emitir("return { arbol: raiz, errores: this.errores };", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Emite el metodo generarId.
	emitirGenerarId() {
		this.emitir("generarId() {", 1);
		this.emitir("// Genera un identificador unico para cada nodo.", 2);
		this.emitir("return 'n_' + (this.contadorId++);", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Emite el metodo obtenerToken.
	emitirObtenerToken() {
		this.emitir("obtenerToken() {", 1);
		this.emitir("// Retorna el token en el indice actual o EOF si no hay mas.", 2);
		this.emitir("if (this.indice < this.tokens.length) {", 2);
		this.emitir("return this.tokens[this.indice];", 3);
		this.emitir("}", 2);
		this.emitir("// Token de fin de archivo por defecto.", 2);
		this.emitir("return { tipo: 'EOF', valor: 'EOF', fila: -1, columna: -1 };", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Emite el metodo consumir que valida y avanza.
	emitirConsumir() {
		this.emitir("consumir(tokenEsperado) {", 1);
		this.emitir("let tokenActual = this.obtenerToken();", 2);
		this.emitir("", 2);
		this.emitir("// Si el token coincide, avanza el indice.", 2);
		this.emitir("if (tokenActual.tipo === tokenEsperado) {", 2);
		this.emitir("this.indice++;", 3);
		this.emitir("return { id: this.generarId(), label: `'${tokenActual.valor}'`, children: [] };", 3);
		this.emitir("} else {", 2);
		this.emitir("// Token inesperado, registra error y retorna nodo de error.", 2);
		this.emitir("this.errores.push({lexema: tokenActual.valor, tipo: 'Sintactico', mensaje: `Se esperaba ${tokenEsperado} pero vino: ${tokenActual.tipo}`, fila: tokenActual.fila, columna: tokenActual.columna });", 3);
		this.emitir("return { id: this.generarId(), label: 'ERROR', children: [] };", 3);
		this.emitir("}", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Emite una funcion para un no terminal usando la tabla LL(1).
	emitirFuncionNoTerminal(noTerminal) {
		this.emitir("terminalL_" + noTerminal + "() {", 1);
		this.emitir("// Nodo de derivacion para " + noTerminal + ".", 2);
		this.emitir("let nodo = { id: this.generarId(), label: '" + noTerminal + "', children: [] };", 2);
		this.emitir("let tokenActual = this.obtenerToken();", 2);
		this.emitir("", 2);
		this.emitir("// Switch basado en el token actual.", 2);
		this.emitir("switch(tokenActual.tipo) {", 2);

		// Obtiene la fila del no terminal en la tabla LL(1).
		const filaNoTerminal = this.tablaLl1[noTerminal] || {};
		const columnasTerminales = Object.keys(filaNoTerminal);

		for (let i = 0; i < columnasTerminales.length; i += 1) {
			const terminal = columnasTerminales[i];
			const produccion = filaNoTerminal[terminal];

			// Procesa la produccion encontrada en la tabla.
			const partes = this.procesarProduccion(produccion);

			this.emitir("case '" + terminal + "':", 3);
			for (let j = 0; j < partes.length; j += 1) {
				this.emitir(partes[j], 4);
			}
			this.emitir("break;", 4);
		}

		// Caso por defecto: error sintactico.
		this.emitir("default:", 3);
		this.emitir("this.errores.push({lexema: `'${tokenActual.valor}'`, tipo: 'Sintactico', mensaje: `Error sintactico en " + noTerminal + ": Token inesperado '${tokenActual.tipo}'`, fila: tokenActual.fila, columna: tokenActual.columna });", 4);
		this.emitir("// Nodo de error para recuperacion minima.", 4);
		this.emitir("nodo.children.push({ id: this.generarId(), label: 'ERROR', children: [] });", 4);
		this.emitir("break;", 4);

		this.emitir("}", 2);
		this.emitir("return nodo;", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Parsea una produccion y genera las lineas de codigo.
	procesarProduccion(produccion) {
		const lineas = [];

		// Produccion de la forma: "A => B C D"
		// Si es vacia (epsilon), se denota como "A => LAMBDA"
		if (typeof produccion !== 'string') {
			return lineas;
		}

		// Limpia la produccion.
		const partes = produccion.trim().split(/\s+/);
		
		for (let i = 0; i < partes.length; i += 1) {
			const parte = partes[i];

			if (parte === "LAMBDA" || parte === "ε") {
				// Produccion vacia: agrega nodo lambda.
				lineas.push("nodo.children.push({ id: this.generarId(), label: 'LAMBDA', children: [] });");
			} else if (parte === "<=") {
				// Ignora el operador de produccion.
				continue;
			} else if (parte.startsWith("$") || parte.match(/^[A-Z_][A-Z0-9_]*$/)) {
				// Es terminal (convencional: mayuscula o con $).
				lineas.push("nodo.children.push(this.consumir('" + parte + "'));");
			} else {
				// Es no terminal (convencional: minuscula o con %).
				lineas.push("nodo.children.push(this.terminalL_" + parte + "());");
			}
		}

		return lineas;
	}

	// Genera todas las funciones de no terminales.
	emitirFuncionesNoTerminales() {
		// Obtiene lista de no terminales unicos de la tabla LL(1).
		const noTerminales = Object.keys(this.tablaLl1 || {});

		for (let i = 0; i < noTerminales.length; i += 1) {
			const noTerminal = noTerminales[i];
			this.emitirFuncionNoTerminal(noTerminal);
		}
	}

	// Emite el pie de la clase.
	emitirPie() {
		this.emitir("}", 0);
		this.emitir("", 0);
		this.codigoGenerado += "// Exporta la clase parser para inyeccion en caliente.\n";
		this.codigoGenerado += "export default ParserGenerado;\n";
	}

	// Genera el codigo completo del parser.
	generar() {
		try {
			this.codigoGenerado = "";
			this.contadorIdNodo = 0;
			
			this.emitirCabecera();
			this.emitirEstructuraGramatica();
			this.emitirMetodoParse();
			this.emitirGenerarId();
			this.emitirObtenerToken();
			this.emitirConsumir();
			this.emitirFuncionesNoTerminales();
			this.emitirPie();

			return this.codigoGenerado;
		} catch (error) {
			throw new Error("Error al generar codigo del parser: " + error.message);
		}
	}
}

// Funcion publica para generar el parser desde AST y tabla LL(1).
export function generarParserDescendente(ast, tablaLl1) {
	const generador = new GeneradorParserDescendente(ast, tablaLl1);
	return generador.generar();
}

// Export de la clase para pruebas directas si es necesario.
export { GeneradorParserDescendente };
