function crearElementoError(tipo, detalle, linea = null, columna = null) {
	const posicion = linea != null && columna != null ? ` (L${linea}, C${columna})` : '';
	return {
		type: tipo,
		scope: 'Configuracion',
		detail: `${detalle}${posicion}`
	};
}

export async function evaluarConfiguracionWison(textoFuente) {
	if (typeof textoFuente !== 'string' || textoFuente.trim().length === 0) {
		return {
			ok: false,
			ast: null,
			errores: [crearElementoError('Validacion', 'La configuración está vacía.')]
		};
	}

	try {
		const response = await fetch('/api/wison/evaluate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ textoFuente })
		});

		const data = await response.json();
		if (!response.ok) {
			return {
				ok: false,
				ast: null,
				errores: data?.errores ?? [crearElementoError('Infraestructura', 'Fallo la evaluacion en servidor.')]
			};
		}

		return {
			ok: Boolean(data?.ok),
			ast: data?.ast ?? null,
			errores: Array.isArray(data?.errores) ? data.errores : []
		};
	} catch (error) {
		return {
			ok: false,
			ast: null,
			errores: [
				crearElementoError(
					'Infraestructura',
					`No se pudo completar la evaluacion de la configuracion. Detalle tecnico: ${error.message}`
				)
			]
		};
	}
}
