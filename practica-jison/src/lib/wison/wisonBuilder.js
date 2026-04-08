
const PUNTOS_FINALES_POR_DEFECTO = {
	guardarAnalizador: '/api/analyzers',
	obtenerAnalizador: (id) => `/api/analyzers/${encodeURIComponent(id)}`,
	listarAnalizadores: '/api/analyzers',
	compilarAnalizador: '/api/analyzers/compile'
};

// Determina si una URL ya viene completa con protocolo.
function esUrlAbsoluta(valor) {
	return typeof valor === 'string' && /^https?:\/\//i.test(valor);
}

// Une la URL base con una ruta relativa sin duplicar diagonales.
function unirUrl(urlBase, ruta) {
	if (!ruta) return urlBase;
	if (esUrlAbsoluta(ruta)) return ruta;
	if (!urlBase) return ruta;
	return `${urlBase.replace(/\/+$/, '')}/${String(ruta).replace(/^\/+/, '')}`;
}

// Permite que un endpoint sea un string fijo o una función generadora.
function normalizarPuntoFinal(puntoFinal, ...argumentos) {
	if (typeof puntoFinal === 'function') {
		return puntoFinal(...argumentos);
	}

	return puntoFinal;
}

// Compila localmente la gramática si existe un compilador inyectado.
// Si no se proporciona, intenta usar Jison dinámicamente.
async function intentarCompilacionLocal(textoGramatica, compilador) {
	if (typeof compilador === 'function') {
		return compilador(textoGramatica);
	}

	try {
		const module = await import('jison');
		const Jison = module?.default ?? module;

		const parserFactory =
			Jison?.Parser ??
			Jison?.Generator ??
			Jison;

		if (typeof parserFactory !== 'function') {
			throw new Error('El paquete jison no expone un constructor compatible.');
		}

		const parser = new parserFactory(textoGramatica);
		const fuenteParser =
			typeof parser.generate === 'function'
				? parser.generate()
				: typeof parser.toString === 'function'
					? parser.toString()
					: null;

		return { parser, fuenteParser, compilador: 'jison' };
	} catch (error) {
		throw new Error(
			`No se pudo compilar la gramática localmente. Configura un compilador o instala jison. Detalle: ${error.message}`
		);
	}
}

// Construye el artefacto final que puede almacenarse en RAM o persistirse.
// Incluye la gramática original, la salida del compilador y metadatos.
function construirArtefactoAnalizador(textoGramatica, resultadoCompilado, metadatos = {}) {
	const fuenteParser =
		typeof resultadoCompilado === 'string'
			? resultadoCompilado
			: resultadoCompilado?.fuenteParser ?? null;

	return {
		kind: 'wison-analyzer',
		grammar: {
			format: 'jison',
			source: textoGramatica
		},
		parser: {
			generator: resultadoCompilado?.compilador ?? metadatos.generator ?? 'unknown',
			source: fuenteParser
		},
		metadata: {
			createdAt: new Date().toISOString(),
			...metadatos
		}
	};
}

// Builder principal de Wison.
// Centraliza la compilación de gramáticas y la comunicación con la API.
export class ConstructorWison {
	constructor({
		urlBaseApi = '',
		implementacionFetch = globalThis.fetch,
		puntosFinales = {},
		compilador = null
	} = {}) {
		// Configuración de conexión y compilación inyectable.
		this.urlBaseApi = urlBaseApi;
		this.implementacionFetch = implementacionFetch;
		this.compilador = compilador;
		this.puntosFinales = {
			...PUNTOS_FINALES_POR_DEFECTO,
			...puntosFinales
		};
	}

	// Compila la gramática y devuelve el artefacto estructurado.
	async compilarGramatica(textoGramatica, opciones = {}) {
		if (typeof textoGramatica !== 'string' || textoGramatica.trim().length === 0) {
			throw new Error('La gramática de entrada debe ser un texto no vacío.');
		}

		const resultadoCompilado = await intentarCompilacionLocal(textoGramatica, opciones.compilador ?? this.compilador);
		return construirArtefactoAnalizador(textoGramatica, resultadoCompilado, opciones.metadatos);
	}

	// Envía el artefacto del analizador a la API para su persistencia.
	async guardarAnalizador(artefactoAnalizador, opciones = {}) {
		if (typeof this.implementacionFetch !== 'function') {
			throw new Error('No hay una implementación de fetch disponible para llamar a la API.');
		}

		const puntoFinal = normalizarPuntoFinal(
			opciones.puntoFinal ?? this.puntosFinales.guardarAnalizador,
			artefactoAnalizador,
			opciones
		);
		const url = unirUrl(this.urlBaseApi, puntoFinal);

		const response = await this.implementacionFetch(url, {
			method: opciones.metodo ?? 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(opciones.encabezados ?? {})
			},
			body: JSON.stringify(artefactoAnalizador)
		});

		if (!response.ok) {
			const mensaje = await response.text().catch(() => '');
			throw new Error(`Error al guardar el analizador en la API (${response.status}): ${mensaje}`);
		}

		return response.json();
	}

	// Recupera un analizador previamente almacenado en la API.
	async cargarAnalizador(idAnalizador, opciones = {}) {
		if (typeof this.implementacionFetch !== 'function') {
			throw new Error('No hay una implementación de fetch disponible para llamar a la API.');
		}

		const puntoFinal = normalizarPuntoFinal(
			opciones.puntoFinal ?? this.puntosFinales.obtenerAnalizador,
			idAnalizador,
			opciones
		);
		const url = unirUrl(this.urlBaseApi, puntoFinal);

		const response = await this.implementacionFetch(url, {
			method: opciones.metodo ?? 'GET',
			headers: {
				Accept: 'application/json',
				...(opciones.encabezados ?? {})
			}
		});

		if (!response.ok) {
			const mensaje = await response.text().catch(() => '');
			throw new Error(`Error al cargar el analizador desde la API (${response.status}): ${mensaje}`);
		}

		return response.json();
	}

	// Obtiene el catálogo de analizadores disponibles en la API.
	async listarAnalizadores(opciones = {}) {
		if (typeof this.implementacionFetch !== 'function') {
			throw new Error('No hay una implementación de fetch disponible para llamar a la API.');
		}

		const puntoFinal = normalizarPuntoFinal(opciones.puntoFinal ?? this.puntosFinales.listarAnalizadores, opciones);
		const url = unirUrl(this.urlBaseApi, puntoFinal);

		const response = await this.implementacionFetch(url, {
			method: opciones.metodo ?? 'GET',
			headers: {
				Accept: 'application/json',
				...(opciones.encabezados ?? {})
			}
		});

		if (!response.ok) {
			const mensaje = await response.text().catch(() => '');
			throw new Error(`Error al listar analizadores desde la API (${response.status}): ${mensaje}`);
		}

		return response.json();
	}

	// Flujo completo: compila la gramática y, si corresponde, la guarda en la API.
	async compilarYGuardar(textoGramatica, opciones = {}) {
		const artefactoAnalizador = await this.compilarGramatica(textoGramatica, opciones);
		if (opciones.persistir === false) {
			return artefactoAnalizador;
		}

		return this.guardarAnalizador(artefactoAnalizador, opciones.api ?? opciones);
	}

	// Descarga un analizador y, si incluye la gramática fuente, lo recompila localmente.
	async restaurarAnalizadorDesdeApi(idAnalizador, opciones = {}) {
		const registroAnalizador = await this.cargarAnalizador(idAnalizador, opciones.api ?? opciones);
		const textoGramatica = registroAnalizador?.grammar?.source ?? registroAnalizador?.grammarText ?? '';

		if (!textoGramatica) {
			return registroAnalizador;
		}

		const resultadoCompilado = await intentarCompilacionLocal(textoGramatica, opciones.compilador ?? this.compilador);
		return {
			...registroAnalizador,
			compilado: construirArtefactoAnalizador(textoGramatica, resultadoCompilado, opciones.metadatos)
		};
	}
}

// Factory helper para crear instancias sin usar directamente `new`.
export function crearConstructorWison(configuracion) {
	return new ConstructorWison(configuracion);
}

// Export por defecto para importaciones simples.
export default ConstructorWison;