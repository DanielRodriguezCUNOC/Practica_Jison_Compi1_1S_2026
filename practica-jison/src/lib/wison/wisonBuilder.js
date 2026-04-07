
const DEFAULT_ENDPOINTS = {
	saveAnalyzer: '/api/analyzers',
	getAnalyzer: (id) => `/api/analyzers/${encodeURIComponent(id)}`,
	listAnalyzers: '/api/analyzers',
	compileAnalyzer: '/api/analyzers/compile'
};

// Determina si una URL ya viene completa con protocolo.
function isAbsoluteUrl(value) {
	return typeof value === 'string' && /^https?:\/\//i.test(value);
}

// Une la URL base con una ruta relativa sin duplicar diagonales.
function joinUrl(baseUrl, path) {
	if (!path) return baseUrl;
	if (isAbsoluteUrl(path)) return path;
	if (!baseUrl) return path;
	return `${baseUrl.replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
}

// Permite que un endpoint sea un string fijo o una función generadora.
function normalizeEndpoint(endpoint, ...args) {
	if (typeof endpoint === 'function') {
		return endpoint(...args);
	}

	return endpoint;
}

// Compila localmente la gramática si existe un compilador inyectado.
// Si no se proporciona, intenta usar Jison dinámicamente.
async function tryLocalCompile(grammarText, compiler) {
	if (typeof compiler === 'function') {
		return compiler(grammarText);
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

		const parser = new parserFactory(grammarText);
		const parserSource =
			typeof parser.generate === 'function'
				? parser.generate()
				: typeof parser.toString === 'function'
					? parser.toString()
					: null;

		return { parser, parserSource, compiler: 'jison' };
	} catch (error) {
		throw new Error(
			`No se pudo compilar la gramática localmente. Configura un compilador o instala jison. Detalle: ${error.message}`
		);
	}
}

// Construye el artefacto final que puede almacenarse en RAM o persistirse.
// Incluye la gramática original, la salida del compilador y metadatos.
function buildAnalyzerArtifact(grammarText, compiledResult, metadata = {}) {
	const parserSource =
		typeof compiledResult === 'string'
			? compiledResult
			: compiledResult?.parserSource ?? null;

	return {
		kind: 'wison-analyzer',
		grammar: {
			format: 'jison',
			source: grammarText
		},
		parser: {
			generator: compiledResult?.compiler ?? metadata.generator ?? 'unknown',
			source: parserSource
		},
		metadata: {
			createdAt: new Date().toISOString(),
			...metadata
		}
	};
}

// Builder principal de Wison.
// Centraliza la compilación de gramáticas y la comunicación con la API.
export class WisonBuilder {
	constructor({
		apiBaseUrl = '',
		fetchImpl = globalThis.fetch,
		endpoints = {},
		compiler = null
	} = {}) {
		// Configuración de conexión y compilación inyectable.
		this.apiBaseUrl = apiBaseUrl;
		this.fetchImpl = fetchImpl;
		this.compiler = compiler;
		this.endpoints = {
			...DEFAULT_ENDPOINTS,
			...endpoints
		};
	}

	// Compila la gramática y devuelve el artefacto estructurado.
	async compileGrammar(grammarText, options = {}) {
		if (typeof grammarText !== 'string' || grammarText.trim().length === 0) {
			throw new Error('La gramática de entrada debe ser un texto no vacío.');
		}

		const compiledResult = await tryLocalCompile(grammarText, options.compiler ?? this.compiler);
		return buildAnalyzerArtifact(grammarText, compiledResult, options.metadata);
	}

	// Envía el artefacto del analizador a la API para su persistencia.
	async saveAnalyzer(analyzerArtifact, options = {}) {
		if (typeof this.fetchImpl !== 'function') {
			throw new Error('No hay una implementación de fetch disponible para llamar a la API.');
		}

		const endpoint = normalizeEndpoint(
			options.endpoint ?? this.endpoints.saveAnalyzer,
			analyzerArtifact,
			options
		);
		const url = joinUrl(this.apiBaseUrl, endpoint);

		const response = await this.fetchImpl(url, {
			method: options.method ?? 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(options.headers ?? {})
			},
			body: JSON.stringify(analyzerArtifact)
		});

		if (!response.ok) {
			const message = await response.text().catch(() => '');
			throw new Error(`Error al guardar el analizador en la API (${response.status}): ${message}`);
		}

		return response.json();
	}

	// Recupera un analizador previamente almacenado en la API.
	async loadAnalyzer(analyzerId, options = {}) {
		if (typeof this.fetchImpl !== 'function') {
			throw new Error('No hay una implementación de fetch disponible para llamar a la API.');
		}

		const endpoint = normalizeEndpoint(
			options.endpoint ?? this.endpoints.getAnalyzer,
			analyzerId,
			options
		);
		const url = joinUrl(this.apiBaseUrl, endpoint);

		const response = await this.fetchImpl(url, {
			method: options.method ?? 'GET',
			headers: {
				Accept: 'application/json',
				...(options.headers ?? {})
			}
		});

		if (!response.ok) {
			const message = await response.text().catch(() => '');
			throw new Error(`Error al cargar el analizador desde la API (${response.status}): ${message}`);
		}

		return response.json();
	}

	// Obtiene el catálogo de analizadores disponibles en la API.
	async listAnalyzers(options = {}) {
		if (typeof this.fetchImpl !== 'function') {
			throw new Error('No hay una implementación de fetch disponible para llamar a la API.');
		}

		const endpoint = normalizeEndpoint(options.endpoint ?? this.endpoints.listAnalyzers, options);
		const url = joinUrl(this.apiBaseUrl, endpoint);

		const response = await this.fetchImpl(url, {
			method: options.method ?? 'GET',
			headers: {
				Accept: 'application/json',
				...(options.headers ?? {})
			}
		});

		if (!response.ok) {
			const message = await response.text().catch(() => '');
			throw new Error(`Error al listar analizadores desde la API (${response.status}): ${message}`);
		}

		return response.json();
	}

	// Flujo completo: compila la gramática y, si corresponde, la guarda en la API.
	async buildAndSave(grammarText, options = {}) {
		const analyzerArtifact = await this.compileGrammar(grammarText, options);
		if (options.persist === false) {
			return analyzerArtifact;
		}

		return this.saveAnalyzer(analyzerArtifact, options.api ?? options);
	}

	// Descarga un analizador y, si incluye la gramática fuente, lo recompila localmente.
	async restoreAnalyzerFromApi(analyzerId, options = {}) {
		const analyzerRecord = await this.loadAnalyzer(analyzerId, options.api ?? options);
		const grammarText = analyzerRecord?.grammar?.source ?? analyzerRecord?.grammarText ?? '';

		if (!grammarText) {
			return analyzerRecord;
		}

		const compiledResult = await tryLocalCompile(grammarText, options.compiler ?? this.compiler);
		return {
			...analyzerRecord,
			compiled: buildAnalyzerArtifact(grammarText, compiledResult, options.metadata)
		};
	}
}

// Factory helper para crear instancias sin usar directamente `new`.
export function createWisonBuilder(config) {
	return new WisonBuilder(config);
}

// Export por defecto para importaciones simples.
export default WisonBuilder;