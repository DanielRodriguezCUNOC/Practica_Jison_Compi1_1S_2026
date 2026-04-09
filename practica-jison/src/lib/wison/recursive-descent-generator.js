// Generador de parser descendente recursivo LL1.
// Toma el AST y la tabla LL1 y genera codigo JavaScript ejecutable.

class GeneradorParserDescendente {
	constructor(ast, tablaLl1) {
		this.ast = ast;
		this.tablaLl1 = tablaLl1 || {};
		this.codigoGenerado = "";
		this.contadorIdNodo = 0;
		this.mapaFuncionesNoTerminales = {};
	}

	// Obtiene el simbolo inicial definido en la gramatica.
	obtenerSimboloInicial() {
		if (!this.ast || !this.ast.syntax || !this.ast.syntax.startSymbol) {
			throw new Error("No se definio el simbolo inicial en la gramatica.");
		}

		return this.ast.syntax.startSymbol;
	}

	// Genera un ID unico para cada nodo del arbol sintactico.
	generarIdNodo() {
		const id = "n_" + this.contadorIdNodo;
		this.contadorIdNodo += 1;
		return id;
	}

	// Emite una linea de codigo con indentacion segun el nivel.
	emitir(linea, nivel) {
		// Si no se especifica nivel, se asume 1.
		let nivelReal = nivel;
		if (nivelReal === undefined || nivelReal === null) {
			nivelReal = 1;
		}

		// Cada nivel de indentacion equivale a un tabulador.
		const indentacion = "\t".repeat(nivelReal);
		this.codigoGenerado += indentacion + linea + "\n";
	}

	// Crea un resultado base para la ejecucion del parser.
	esEspacioCaracter(caracter) {
		return caracter === " " || caracter === "\t" || caracter === "\n" || caracter === "\r";
	}

	// Verifica si un caracter es un digito del 0 al 9.
	esDigitoCaracter(caracter) {
		return caracter >= "0" && caracter <= "9";
	}

	// Verifica si un caracter es una letra mayuscula o minuscula.
	esLetraCaracter(caracter) {
		return (caracter >= "a" && caracter <= "z") || (caracter >= "A" && caracter <= "Z");
	}

	// Normaliza un texto para usarlo como identificador de funcion.
	normalizarIdentificador(texto) {
		let resultado = "";

		if (typeof texto !== "string") {
			return "simbolo";
		}

		for (let i = 0; i < texto.length; i += 1) {
			const caracter = texto.charAt(i);
			if (this.esLetraCaracter(caracter) || this.esDigitoCaracter(caracter) || caracter === "_") {
				resultado += caracter;
			} else {
				resultado += "_";
			}
		}

		if (resultado.length === 0) {
			resultado = "simbolo";
		}

		if (this.esDigitoCaracter(resultado.charAt(0))) {
			resultado = "_" + resultado;
		}

		return resultado;
	}

	// Obtiene o genera el nombre de la funcion para un no terminal dado.
	obtenerNombreFuncionNoTerminal(noTerminal) {
		if (!this.mapaFuncionesNoTerminales[noTerminal]) {
			this.mapaFuncionesNoTerminales[noTerminal] = "analizar_" + this.normalizarIdentificador(noTerminal);
		}

		return this.mapaFuncionesNoTerminales[noTerminal];
	}

	// Registra los nombres de las funciones para cada no terminal segun la tabla LL1.
	registrarFuncionesNoTerminales() {
		const noTerminales = Object.keys(this.tablaLl1 || {});
		for (let i = 0; i < noTerminales.length; i += 1) {
			this.obtenerNombreFuncionNoTerminal(noTerminales[i]);
		}
	}

	// Divide un texto en palabras usando espacios como separadores.
	dividirEnPalabras(texto) {
		const palabras = [];
		let palabraActual = "";

		for (let i = 0; i < texto.length; i += 1) {
			const caracter = texto.charAt(i);
			// Si es un espacio, se completa la palabra actual y se agrega al arreglo.
			if (this.esEspacioCaracter(caracter)) {
				if (palabraActual.length > 0) {
					palabras.push(palabraActual);
					palabraActual = "";
				}
			} else {
				palabraActual += caracter;
			}
		}

		if (palabraActual.length > 0) {
			palabras.push(palabraActual);
		}

		return palabras;
	}

	// Verifica si una parte de la produccion es un simbolo separador como <= o -> (Esta cosa daba problemas).
	esSeparadorProduccion(parte) {
		return parte === "<=" || parte === "=>" || parte === "→" || parte === "->";
	}

	// Verifica si una parte de la produccion representa el simbolo de epsilon o vacio.
	esEpsilon(parte) {
		return parte === "LAMBDA" || parte === "ε";
	}

	// Verifica si una parte de la produccion es un no terminal, si empieza con %.
	esNoTerminal(parte) {
		if (typeof parte !== "string" || parte.length === 0) {
			return false;
		}

		return parte.charAt(0) === "%";
	}

	// Verifica si una parte de la produccion es un terminal, si empieza con $.
	esTerminal(parte) {
		if (typeof parte !== "string" || parte.length === 0) {
			return false;
		}

		return parte.charAt(0) === "$";
	}

	// Escapa caracteres especiales en un texto para usarlo dentro de comillas simples en el codigo generado (evitamos usar ER sino penalizacion XD).
	escaparTexto(texto) {
		let resultado = "";

		for (let i = 0; i < texto.length; i += 1) {
			const caracter = texto.charAt(i);
			if (caracter === "\\") {
				resultado += "\\\\";
			} else if (caracter === "'") {
				resultado += "\\'";
			} else {
				resultado += caracter;
			}
		}

		return resultado;
	}

	// Este metodo se encarga de generar el codigo completo del parser descendente recursivo LL1 a partir del AST y la tabla LL1.
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

	// Formatea una secuencia de simbolos del lado derecho de una produccion para mostrarla en el codigo generado.
	formatearSecuenciaAST(secuencia) {
		if (!secuencia || secuencia.length === 0) {
			return "LAMBDA";
		}

		let resultado = "";
		for (let i = 0; i < secuencia.length; i += 1) {
			const simbolo = secuencia[i];
			let valor = "?";

			if (simbolo && typeof simbolo === "object" && simbolo.value) {
				valor = simbolo.value;
			} else if (typeof simbolo === "string" && simbolo.length > 0) {
				valor = simbolo;
			}

			if (i > 0) {
				resultado += " ";
			}
			resultado += valor;
		}

		if (resultado.length === 0) {
			return "LAMBDA";
		}

		return resultado;
	}

	// Este metodo recorre las producciones del AST y las formatea para incluirlas como un string en el codigo generado, accesible desde la propiedad estructuraGramatica.
	emitirEstructuraGramatica() {
		
		this.emitir("get estructuraGramatica() {", 1);
		this.emitir("return `", 2);

		const producciones = this.ast && this.ast.syntax && Array.isArray(this.ast.syntax.productions) ? this.ast.syntax.productions : [];
		for (let i = 0; i < producciones.length; i += 1) {
			// Para cada produccion, se obtiene el lado izquierdo (lhs) y el lado derecho (rhs) y se formatea como una linea de texto.
			const prod = producciones[i];
			const lhs = prod && prod.lhs ? prod.lhs : "?";
			const rhs = prod && Array.isArray(prod.rhs) ? prod.rhs : [];

			for (let j = 0; j < rhs.length; j += 1) {
				const secuencia = rhs[j];
				const textoDerecho = this.formatearSecuenciaAST(secuencia);
				this.codigoGenerado += "\t\t" + lhs + " <= " + textoDerecho + ";\n";
			}
		}

		this.emitir("`;", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Este metodo emite el codigo del metodo parse() del parser generado, que es el punto de entrada para ejecutar el parser con una lista de tokens de entrada. El metodo parse() se encarga de inicializar el estado del parser, arrancar la derivacion desde el simbolo inicial, verificar que no queden tokens pendientes y devolver el arbol sintactico resultante junto con los errores encontrados.
	emitirMetodoParse() {
		this.emitir("parse(tokensEntrada) {", 1);
		this.emitir("// Inicializa el estado del parser.", 2);
		this.emitir("this.tokens = tokensEntrada;", 2);
		this.emitir("this.indice = 0;", 2);
		this.emitir("this.errores = [];", 2);
		this.emitir("this.contadorId = 0;", 2);
		this.emitir("", 2);

		// Arranca la derivacion desde el simbolo inicial definido en la gramatica.
		const simboloInicial = this.obtenerSimboloInicial();
		// Obtiene el nombre de la funcion correspondiente al simbolo inicial para invocarla.
		const nombreFuncionInicial = this.obtenerNombreFuncionNoTerminal(simboloInicial);
		this.emitir("// Arranca desde el simbolo inicial.", 2);
		// El resultado de esta llamada sera el nodo raiz del arbol sintactico generado.
		this.emitir("let raiz = this." + nombreFuncionInicial + "();", 2);
		// Luego de intentar derivar el simbolo inicial, se verifica que no hayan quedado tokens pendientes sin consumir, lo cual indicaria un error sintactico.
		this.emitir("let tokenFinal = this.obtenerToken();", 2);
		// Si el token final no es EOF, se registra un error indicando que se esperaba el fin de la entrada pero se encontro un token inesperado.
		this.emitir("", 2);
		// Verifica que el token final sea EOF, si no lo es, se agrega un error indicando que se esperaba EOF pero se encontro otro token.
		this.emitir("// Verifica que ya no queden tokens pendientes.", 2);
		// Si el token final no es EOF, se agrega un error indicando que se esperaba EOF pero se encontro otro token.
		this.emitir("if (tokenFinal.tipo !== 'EOF') {", 2);
		// Agrega un error indicando que se esperaba EOF pero se encontro otro token, incluyendo el lexema, tipo, mensaje y posicion del token inesperado.
		this.emitir("this.errores.push({ lexema: 'EOF', tipo: 'Sintactico', mensaje: 'Se esperaba EOF, pero se encontro ' + tokenFinal.tipo, fila: tokenFinal.fila, columna: tokenFinal.columna });", 3);
		this.emitir("}", 2); // Cierra la verificacion de tokens pendientes.
		this.emitir("", 2); // Devuelve el resultado del parseo, que incluye el arbol sintactico generado a partir del simbolo inicial y los errores encontrados durante la derivacion.
		this.emitir("// Devuelve arbol y errores.", 2);// El resultado es un objeto con la propiedad arbol que contiene la raiz del arbol sintactico generado, y la propiedad errores que es un arreglo de errores sintacticos encontrados durante el parseo.
		this.emitir("return { arbol: raiz, errores: this.errores };", 2); // Cierra el metodo parse().
		this.emitir("}", 1); // Cierra la clase ParserGenerado.
		this.emitir("", 0); // Agrega una linea vacia al final para mejor legibilidad del codigo generado.
	}

	// Este metodo emite el codigo de la funcion generarId() del parser generado, que se encarga de generar un identificador unico para cada nodo del arbol sintactico. Esto es util para poder diferenciar los nodos en el resultado final y evitar colisiones de nombres. El metodo generarId() utiliza un contador interno que se incrementa cada vez que se genera un nuevo ID, y retorna un string con el formato "n_" seguido del numero del contador.
	emitirGenerarId() {
		this.emitir("generarId() {", 1);
		this.emitir("// Genera un identificador unico para cada nodo.", 2);
		this.emitir("return 'n_' + (this.contadorId++);", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Este metodo emite el codigo de la funcion obtenerToken() del parser generado, que se encarga de retornar el token actual que se esta procesando en la derivacion. El parser mantiene un arreglo de tokens de entrada y un indice que indica la posicion actual en ese arreglo. La funcion obtenerToken() verifica si el indice es menor que la longitud del arreglo de tokens, lo cual indicaria que hay un token disponible para procesar, y en ese caso retorna el token en esa posicion. Si el indice ya ha alcanzado o superado la longitud del arreglo, esto significa que se han consumido todos los tokens disponibles, y por lo tanto retorna un token especial de tipo EOF con valor "EOF" y posicion -1 para indicar que no hay mas tokens por procesar.
	emitirObtenerToken() {
		this.emitir("obtenerToken() {", 1);// El metodo obtenerToken() retorna el token actual o EOF si ya no hay mas tokens disponibles en la entrada.
		this.emitir("// Retorna el token actual o EOF si ya no hay mas.", 2); //Ya hasta aqui llegue comentando linea por linea XD. Toy cansao papito
		this.emitir("if (this.indice < this.tokens.length) {", 2);
		this.emitir("return this.tokens[this.indice];", 3);
		this.emitir("}", 2);
		this.emitir("// Token de fin de entrada por defecto.", 2);
		this.emitir("return { tipo: 'EOF', valor: 'EOF', fila: -1, columna: -1 };", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Este metodo emite el codigo de la funcion consumir(tokenEsperado) del parser generado, que se encarga de verificar si el token actual coincide con el token esperado que se le pasa como argumento. Si el token actual tiene un tipo que coincide con el token esperado, esto indica que la derivacion es correcta en ese punto, y por lo tanto se avanza al siguiente token incrementando el indice, y se retorna un nodo del arbol sintactico con un ID unico generado por generarId(), una etiqueta que es el valor del token actual, y un arreglo de hijos vacio. Si el token actual no coincide con el token esperado, esto indica que hay un error sintactico en la entrada, y por lo tanto se registra un error en el arreglo de errores del parser, incluyendo el lexema del token actual, su tipo, un mensaje indicando que se esperaba un token pero se encontro otro, y la posicion del token (fila y columna). En este caso de error, se retorna un nodo del arbol sintactico con un ID unico generado por generarId(), una etiqueta "ERROR" para indicar que hubo un error en esa parte de la derivacion, y un arreglo de hijos vacio.
	emitirConsumir() {
		this.emitir("consumir(tokenEsperado) {", 1);
		this.emitir("const tokenActual = this.obtenerToken();", 2);
		this.emitir("", 2);
		this.emitir("// Si coincide, avanza al siguiente token.", 2);
		this.emitir("if (tokenActual.tipo === tokenEsperado) {", 2);
		this.emitir("this.indice++;", 3);
		this.emitir("return { id: this.generarId(), label: tokenActual.valor, children: [] };", 3);
		this.emitir("}", 2);
		this.emitir("", 2);
		this.emitir("// Si no coincide, registra error.", 2);
		this.emitir("this.errores.push({ lexema: tokenActual.valor, tipo: 'Sintactico', mensaje: 'Se esperaba ' + tokenEsperado + ' pero vino: ' + tokenActual.tipo, fila: tokenActual.fila, columna: tokenActual.columna });", 2);
		this.emitir("return { id: this.generarId(), label: 'ERROR', children: [] };", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Este metodo emite el codigo de la funcion para analizar un no terminal especifico, que se genera para cada no terminal definido en la tabla LL1. El nombre de la funcion se obtiene a partir del nombre del no terminal utilizando el metodo obtenerNombreFuncionNoTerminal(). El cuerpo de la funcion consiste en un switch que selecciona la produccion a aplicar segun el token actual, utilizando la informacion de la tabla LL1 para ese no terminal. Para cada produccion posible, se generan las llamadas recursivas a las funciones correspondientes para los no terminales que aparecen en el lado derecho de la produccion, o llamadas a consumir() para los terminales. Si el token actual no coincide con ninguna produccion valida segun la tabla LL1, se registra un error sintactico indicando que se esperaba un token diferente, y se agrega un nodo de error al arbol sintactico para esa parte de la derivacion.
	emitirFuncionNoTerminal(noTerminal) {
		const nombreFuncion = this.obtenerNombreFuncionNoTerminal(noTerminal);
		this.emitir(nombreFuncion + "() {", 1);
		this.emitir("// Nodo que representa la derivacion actual.", 2);
		this.emitir("const nodo = { id: this.generarId(), label: '" + noTerminal + "', children: [] };", 2);
		this.emitir("const tokenActual = this.obtenerToken();", 2);
		this.emitir("", 2);
		this.emitir("// Selecciona la produccion segun el token actual.", 2);
		this.emitir("switch (tokenActual.tipo) {", 2);

		const filaNoTerminal = this.tablaLl1[noTerminal] || {};
		const columnasTerminales = Object.keys(filaNoTerminal);
		for (let i = 0; i < columnasTerminales.length; i += 1) {
			const terminal = columnasTerminales[i];
			const produccion = filaNoTerminal[terminal];
			const partes = this.procesarProduccion(produccion);

			this.emitir("case '" + this.escaparTexto(terminal) + "':", 3);
			for (let j = 0; j < partes.length; j += 1) {
				this.emitir(partes[j], 4);
			}
			this.emitir("break;", 4);
		}

		this.emitir("default:", 3);
		this.emitir("this.errores.push({ lexema: tokenActual.valor, tipo: 'Sintactico', mensaje: 'Error sintactico en " + noTerminal + ": Token inesperado ' + tokenActual.tipo, fila: tokenActual.fila, columna: tokenActual.columna });", 4);
		this.emitir("// Recuperacion minima con un nodo de error.", 4);
		this.emitir("nodo.children.push({ id: this.generarId(), label: 'ERROR', children: [] });", 4);
		this.emitir("break;", 4);

		this.emitir("}", 2);
		this.emitir("return nodo;", 2);
		this.emitir("}", 1);
		this.emitir("", 0);
	}

	// Este metodo procesa una produccion del lado derecho de la gramatica y genera las lineas de codigo correspondientes para incluirlas en el cuerpo de la funcion del no terminal. La produccion se divide en partes utilizando espacios como separadores, y se analiza cada parte para determinar si es un simbolo separador, un simbolo de epsilon, un no terminal o un terminal. Dependiendo del tipo de cada parte, se generan las llamadas recursivas a las funciones correspondientes o las llamadas a consumir() para los terminales, o se agrega un nodo de LAMBDA para los simbolos de epsilon. El resultado es un arreglo de lineas de codigo que representan la secuencia de acciones a realizar para derivar esa produccion en el parser generado.
	procesarProduccion(produccion) {
		const lineas = [];

		if (typeof produccion !== "string") {
			return lineas;
		}

		const partes = this.dividirEnPalabras(produccion);
		let inicio = 0;

		if (partes.length > 1 && this.esSeparadorProduccion(partes[1])) {
			inicio = 2;
		} else if (partes.length > 0 && this.esSeparadorProduccion(partes[0])) {
			inicio = 1;
		}

		if (inicio >= partes.length) {
			lineas.push("nodo.children.push({ id: this.generarId(), label: 'LAMBDA', children: [] });");
			return lineas;
		}

		for (let i = inicio; i < partes.length; i += 1) {
			const parte = partes[i];

			if (this.esSeparadorProduccion(parte)) {
				continue;
			}

			if (this.esEpsilon(parte)) {
				lineas.push("nodo.children.push({ id: this.generarId(), label: 'LAMBDA', children: [] });");
				continue;
			}

			if (this.esNoTerminal(parte)) {
				lineas.push("nodo.children.push(this." + this.obtenerNombreFuncionNoTerminal(parte) + "());");
				continue;
			}

			lineas.push("nodo.children.push(this.consumir('" + this.escaparTexto(parte) + "')); ");
		}

		return lineas;
	}

	emitirFuncionesNoTerminales() {
		const noTerminales = Object.keys(this.tablaLl1 || {});
		for (let i = 0; i < noTerminales.length; i += 1) {
			this.emitirFuncionNoTerminal(noTerminales[i]);
		}
	}

	// Este metodo emite el codigo de la parte final del parser generado, que incluye el cierre de la clase y la exportacion del parser para su uso en otros modulos. Esto permite que el parser generado pueda ser importado y utilizado en conjunto con un lexer para procesar una entrada de texto y generar un arbol sintactico a partir de ella.
	emitirPie() {
		this.emitir("}", 0);
		this.emitir("", 0);
		this.codigoGenerado += "// Exporta la clase parser para inyeccion en caliente.\n";
		this.codigoGenerado += "export default ParserGenerado;\n";
	}

	// Este metodo es el punto de entrada para generar el codigo completo del parser descendente recursivo LL1. Se encarga de inicializar el estado del generador, emitir cada parte del codigo en el orden correcto, y retornar el resultado final como un string. Si ocurre algun error durante la generacion, se captura y se lanza un nuevo error con un mensaje descriptivo para facilitar la depuracion.
	generar() {
		try {
			this.codigoGenerado = "";
			this.contadorIdNodo = 0;
			this.mapaFuncionesNoTerminales = {};

			this.emitirCabecera();
			this.emitirEstructuraGramatica();
			this.emitirMetodoParse();
			this.emitirGenerarId();
			this.emitirObtenerToken();
			this.emitirConsumir();
			this.registrarFuncionesNoTerminales();
			this.emitirFuncionesNoTerminales();
			this.emitirPie();

			return this.codigoGenerado;
		} catch (error) {
			throw new Error("Error al generar codigo del parser: " + error.message);
		}
	}
}

// Funcion principal para generar el parser descendente recursivo LL1 a partir del AST y la tabla LL1. Esta funcion se puede exportar y utilizar en otros modulos para generar el codigo del parser de manera sencilla, simplemente pasando el AST y la tabla LL1 como argumentos. El resultado sera un string con el codigo JavaScript completo del parser generado, este codigo esta listo para ser evaluado o tener presistencia atraves de la API.
export function generarParserDescendente(ast, tablaLl1) {
	const generador = new GeneradorParserDescendente(ast, tablaLl1);
	return generador.generar();
}

export { GeneradorParserDescendente };
