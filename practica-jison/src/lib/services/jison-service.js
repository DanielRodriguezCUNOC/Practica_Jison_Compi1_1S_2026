// Crea un objeto de error homogeneo para la UI.
function crearElementoError(tipo, detalle, linea = null, columna = null) {
	const posicion = linea != null && columna != null ? ` (L${linea}, C${columna})` : '';
	return {
		type: tipo,
		scope: 'Configuracion',
		detail: `${detalle}${posicion}`
	};
}

// Construye una respuesta base para evitar valores undefined.
function crearRespuestaBase() {
	return {
		ok: false,
		ast: null,
		errores: [],
		conjuntosPrimeroSiguiente: null,
		tablaLl1: null,
		conflictosLl1: null
	};
}

// Evalua la configuracion Wison en el endpoint del servidor.
export async function evaluarConfiguracionWison(textoFuente) {
	if (typeof textoFuente !== 'string' || textoFuente.trim().length === 0) {
		const respuesta = crearRespuestaBase();
		respuesta.errores = [crearElementoError('Validacion', 'La configuracion esta vacia.')];
		return respuesta;
	}

	try {
		// Envia la configuracion al backend para parseo completo.
		const response = await fetch('/api/wison/evaluate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ textoFuente })
		});

		let data = null;
		try {
			// Intenta leer JSON de respuesta aun si vino con error HTTP.
			data = await response.json();
		} catch {
			data = null;
		}

		if (!response.ok) {
			const respuesta = crearRespuestaBase();
			respuesta.errores = Array.isArray(data?.errores)
				? data.errores
				: [crearElementoError('Infraestructura', 'Fallo la evaluacion en servidor.')];
			return respuesta;
		}

		// Normaliza siempre todos los campos para el frontend.
		const respuesta = crearRespuestaBase();
		respuesta.ok = Boolean(data?.ok);
		respuesta.ast = data?.ast ?? null;
		respuesta.errores = Array.isArray(data?.errores) ? data.errores : [];
		respuesta.conjuntosPrimeroSiguiente = data?.conjuntosPrimeroSiguiente ?? null;
		respuesta.tablaLl1 = data?.tablaLl1 ?? null;
		respuesta.conflictosLl1 = data?.conflictosLl1 ?? null;
		return respuesta;
	} catch (error) {
		const respuesta = crearRespuestaBase();
		respuesta.errores = [
			crearElementoError(
				'Infraestructura',
				`No se pudo completar la evaluacion de la configuracion. Detalle tecnico: ${error.message}`
			)
		];
		return respuesta;
	}
}
