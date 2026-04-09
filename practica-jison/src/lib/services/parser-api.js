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
		`${codigoNormalizado}\n; return (typeof ParserGenerado === 'function') ? ParserGenerado : null;`
);

	const ClaseParser = fabrica();
	if (typeof ClaseParser !== 'function') {
		throw new Error('No se pudo obtener la clase ParserGenerado.');
	}

	// Retorna una instancia lista para parsear tokens.
	return new ClaseParser();
}

// Ejecuta el parser activo con una lista de tokens del lexer.
export function ejecutarParserGenerado(parserInstancia, tokensEntrada) {
	const resultado = crearResultadoBase();

	if (!parserInstancia || typeof parserInstancia.parse !== 'function') {
		resultado.errores.push(crearErrorParser('No hay un parser generado activo.'));
		return resultado;
	}

	if (!Array.isArray(tokensEntrada)) {
		resultado.errores.push(crearErrorParser('La entrada del parser debe ser un arreglo de tokens.'));
		return resultado;
	}

	try {
		// Ejecuta parse y respeta la estructura esperada del parser generado.
		const salida = parserInstancia.parse(tokensEntrada);
		resultado.ok = true;
		resultado.arbol = salida?.arbol ?? null;
		resultado.errores = Array.isArray(salida?.errores) ? salida.errores : [];
		return resultado;
	} catch (error) {
		resultado.errores.push(
crearErrorParser(`Error al ejecutar el parser generado. Detalle tecnico: ${error.message}`)
);
		return resultado;
	}
}
