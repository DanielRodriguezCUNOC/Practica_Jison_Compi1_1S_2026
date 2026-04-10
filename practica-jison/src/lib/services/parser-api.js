// Crea un resultado base de ejecucion para mantener contrato estable.
function crearResultadoBase() {
	return {
		ok: false,
		arbol: null,
		errores: []
	};
}

// Crea un error estandar para mostrar en consola de la app.
function crearErrorParser(mensaje) {
	return {
		type: 'Sintactico',
		scope: 'ParserGenerado',
		detail: mensaje
	};
}

function crearErrorParserConPosicion(mensaje, linea = null, columna = null) {
	return {
		type: 'Sintactico',
		scope: 'ParserGenerado',
		detail: mensaje,
		line: linea,
		column: columna
	};
}

function mapearErrorDeJison(error) {
	const mensaje = String(error?.message ?? 'Error no controlado durante el analisis.');
	const linea = error?.hash?.loc?.first_line ?? null;
	const columnaBase = error?.hash?.loc?.first_column ?? null;
	const columna = columnaBase != null ? columnaBase + 1 : null;

	if (linea != null && columna != null) {
		return crearErrorParserConPosicion(mensaje, linea, columna);
	}

	return crearErrorParser(mensaje);
}

// Inyecta en caliente una clase parser a partir de codigo fuente.
export function inyectarParserEnCaliente(codigoFuente) {
	if (typeof codigoFuente !== 'string' || codigoFuente.trim().length === 0) {
		throw new Error('El codigo fuente del parser esta vacio.');
	}

	// Limpia exportaciones ESM para evaluar el codigo en tiempo de ejecucion.
	let codigoNormalizado = codigoFuente;
	codigoNormalizado = codigoNormalizado.replace(/export\s+default\s+ParserGenerado\s*;?/g, '');
	codigoNormalizado = codigoNormalizado.replace(/export\s*\{[^}]*\}\s*;?/g, '');

	// Se crea una funcion aislada que retorna la clase parser.
	const fabrica = new Function(
		`${codigoNormalizado}\n;` +
			"var candidatoParser = null;" +
			"if (typeof ParserGenerado === 'function') { candidatoParser = new ParserGenerado(); }" +
			"else if (typeof parser !== 'undefined' && parser && typeof parser.parse === 'function') { candidatoParser = parser; }" +
			"else if (typeof exports !== 'undefined' && exports && exports.parser && typeof exports.parser.parse === 'function') { candidatoParser = exports.parser; }" +
			"else if (typeof module !== 'undefined' && module && module.exports && module.exports.parser && typeof module.exports.parser.parse === 'function') { candidatoParser = module.exports.parser; }" +
			"return candidatoParser;"
);

	const parserInstancia = fabrica();
	if (!parserInstancia || typeof parserInstancia.parse !== 'function') {
		throw new Error('No se pudo obtener una instancia parser valida.');
	}

	// Retorna una instancia lista para parsear tokens.
	return parserInstancia;
}

// Ejecuta el parser activo con una lista de tokens del lexer.
export function ejecutarParserGenerado(parserInstancia, entradaAnalisis) {
	const resultado = crearResultadoBase();

	if (!parserInstancia || typeof parserInstancia.parse !== 'function') {
		resultado.errores.push(crearErrorParser('No hay un parser generado activo.'));
		return resultado;
	}

	const entradaValida =
		typeof entradaAnalisis === 'string' || Array.isArray(entradaAnalisis);

	if (!entradaValida) {
		resultado.errores.push(
			crearErrorParser('La entrada del parser debe ser texto o una lista de tokens.')
		);
		return resultado;
	}

	try {
		// Ejecuta parse y normaliza la salida para la UI.
		const salida = parserInstancia.parse(entradaAnalisis);
		resultado.ok = true;
		resultado.arbol = salida?.arbol ?? salida ?? null;
		resultado.errores = Array.isArray(salida?.errores) ? salida.errores : [];
		return resultado;
	} catch (error) {
		resultado.errores.push(mapearErrorDeJison(error));
		return resultado;
	}
}
