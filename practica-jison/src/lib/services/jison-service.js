import { inyectarParserEnCaliente } from '$lib/services/parser-api';

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
			conjuntosPrimeroSiguiente: null,
			tablaLl1: null,
			conflictosLl1: null,
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
				conjuntosPrimeroSiguiente: null,
				tablaLl1: null,
				conflictosLl1: null,
				errores: data?.errores ?? [crearElementoError('Infraestructura', 'Fallo la evaluacion en servidor.')]
			};
		}

		return {
			ok: Boolean(data?.ok),
			ast: data?.ast ?? null,
			conjuntosPrimeroSiguiente: data?.conjuntosPrimeroSiguiente ?? null,
			tablaLl1: data?.tablaLl1 ?? null,
			conflictosLl1: data?.conflictosLl1 ?? null,
			parserObjetivoGramatica: data?.parserObjetivoGramatica ?? '',
			parserObjetivoFuente: data?.parserObjetivoFuente ?? '',
			errores: Array.isArray(data?.errores) ? data.errores : []
		};
	} catch (error) {
		return {
			ok: false,
			ast: null,
			conjuntosPrimeroSiguiente: null,
			tablaLl1: null,
			conflictosLl1: null,
			parserObjetivoGramatica: '',
			parserObjetivoFuente: '',
			errores: [
				crearElementoError(
					'Infraestructura',
					`No se pudo completar la evaluacion de la configuracion. Detalle tecnico: ${error.message}`
				)
			]
		};
	}
}

export async function compilarAnalizadorWison(textoFuente) {
	const evaluacion = await evaluarConfiguracionWison(textoFuente);

	if (!evaluacion.ok) {
		return {
			...evaluacion,
			parserGeneradoFuente: '',
			parserGeneradoInstancia: null
		};
	}

	try {
		const parserGeneradoFuente = evaluacion.parserObjetivoGramatica ?? '';
		const parserObjetivoFuente = evaluacion.parserObjetivoFuente ?? '';

		if (typeof parserObjetivoFuente !== 'string' || parserObjetivoFuente.trim().length === 0) {
			throw new Error('La evaluacion no devolvio codigo fuente del analizador objetivo.');
		}

		const parserGeneradoInstancia = inyectarParserEnCaliente(parserObjetivoFuente);

		return {
			...evaluacion,
			parserGeneradoFuente,
			parserGeneradoInstancia
		};
	} catch (error) {
		return {
			ok: false,
			ast: evaluacion.ast,
			conjuntosPrimeroSiguiente: evaluacion.conjuntosPrimeroSiguiente,
			tablaLl1: evaluacion.tablaLl1,
			conflictosLl1: evaluacion.conflictosLl1,
			parserGeneradoFuente: '',
			parserGeneradoInstancia: null,
			errores: [crearElementoError('Infraestructura', `Error al generar el analizador. ${error.message}`)]
		};
	}
}
