const API_BASE_URL =
	import.meta.env.VITE_API_URL ??
	import.meta.env.VITE_API_BASE_URL ??
	'/api/v1';

function construirUrl(ruta) {
	const baseNormalizada = API_BASE_URL.replace(/\/+$/, '');
	const rutaNormalizada = String(ruta || '').replace(/^\/+/, '');
	return `${baseNormalizada}/${rutaNormalizada}`;
}

async function leerJsonSeguro(response) {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

function obtenerMensajeError(data, estado) {
	if (Array.isArray(data?.errores) && data.errores.length > 0) {
		const primerError = data.errores[0];
		if (primerError?.mensaje) {
			return primerError.mensaje;
		}
	}
	return `Error en API (HTTP ${estado}).`;
}

export async function guardarAnalizadorApi(nombre, wisonSource) {
	const response = await fetch(construirUrl('/analizadores'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ nombre, wisonSource })
	});

	const data = await leerJsonSeguro(response);
	if (!response.ok) {
		throw new Error(obtenerMensajeError(data, response.status));
	}

	return data;
}

export async function listarAnalizadoresApi() {
	const response = await fetch(construirUrl('/analizadores'), {
		method: 'GET',
		headers: {
			Accept: 'application/json'
		}
	});

	const data = await leerJsonSeguro(response);
	if (!response.ok) {
		throw new Error(obtenerMensajeError(data, response.status));
	}

	return Array.isArray(data?.items) ? data.items : [];
}

export async function obtenerAnalizadorApi(id) {
	const response = await fetch(construirUrl(`/analizadores/${encodeURIComponent(id)}`), {
		method: 'GET',
		headers: {
			Accept: 'application/json'
		}
	});

	const data = await leerJsonSeguro(response);
	if (!response.ok) {
		throw new Error(obtenerMensajeError(data, response.status));
	}

	return data;
}
