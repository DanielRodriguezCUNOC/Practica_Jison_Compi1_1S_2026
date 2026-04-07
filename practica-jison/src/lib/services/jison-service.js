function toErrorItem(type, detail, line = null, column = null) {
	const position = line != null && column != null ? ` (L${line}, C${column})` : '';
	return {
		type,
		scope: 'Configuracion',
		detail: `${detail}${position}`
	};
}

export async function evaluateWisonConfiguration(sourceText) {
	if (typeof sourceText !== 'string' || sourceText.trim().length === 0) {
		return {
			ok: false,
			ast: null,
			errors: [toErrorItem('Validacion', 'La configuración está vacía.')]
		};
	}

	try {
		const response = await fetch('/api/wison/evaluate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ sourceText })
		});

		const data = await response.json();
		if (!response.ok) {
			return {
				ok: false,
				ast: null,
				errors: data?.errors ?? [toErrorItem('Infraestructura', 'Fallo la evaluacion en servidor.')]
			};
		}

		return {
			ok: Boolean(data?.ok),
			ast: data?.ast ?? null,
			errors: Array.isArray(data?.errors) ? data.errors : []
		};
	} catch (error) {
		return {
			ok: false,
			ast: null,
			errors: [
				toErrorItem(
					'Infraestructura',
					`No se pudo completar la evaluacion de la configuracion. Detalle tecnico: ${error.message}`
				)
			]
		};
	}
}
