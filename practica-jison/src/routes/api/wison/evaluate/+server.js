import { json } from '@sveltejs/kit';
import wisonGrammarSource from '$lib/wison/wison-grammar.jison?raw';
import { validarSemanticaWison } from '$lib/wison/semantic-validator';
import { calcularPrimeroSiguiente } from '$lib/wison/first-follow';
import { construirTablaLl1, formatearTablaParseo, formatearConflictos } from '$lib/wison/ll1-table-builder';

function crearElementoError(tipo, detalle, linea = null, columna = null) {
	const posicion = linea != null && columna != null ? ` (L${linea}, C${columna})` : '';
	return {
		type: tipo,
		scope: 'Configuracion',
		detail: `${detalle}${posicion}`
	};
}

function obtenerFabricaParser(jisonModule) {
	const Jison = jisonModule?.default ?? jisonModule;
	const parserFactory = Jison?.Parser ?? Jison?.Generator ?? Jison;

	if (typeof parserFactory !== 'function') {
		throw new Error('El paquete jison no expone un constructor compatible.');
	}

	return parserFactory;
}

function mapearErroresEstructurados(errores = [], etiqueta) {
	return errores.map((item) =>
		crearElementoError(
			etiqueta,
			item?.mensaje ?? 'Error no especificado.',
			item?.linea ?? null,
			item?.columna ?? null
		)
	);
}

function mapearErrorLanzadoParser(error) {
	const mensajeCrudo = String(error?.message ?? 'Error de analisis no controlado.');
	if (/is not defined/i.test(mensajeCrudo)) {
		return crearElementoError(
			'Infraestructura',
			`Error interno del evaluador de Wison. No es un error de tu archivo. Detalle tecnico: ${mensajeCrudo}`
		);
	}

	const lineaDesdeHash = error?.hash?.loc?.first_line ?? null;
	const columnaDesdeHash = error?.hash?.loc?.first_column ?? null;

	if (lineaDesdeHash != null && columnaDesdeHash != null) {
		return crearElementoError('Sintactico', mensajeCrudo, lineaDesdeHash, columnaDesdeHash + 1);
	}

	const coincidenciaPila = String(error?.stack ?? '').match(/:(\d+):(\d+)\)?(?:\n|$)/);
	const lineaPila = coincidenciaPila ? Number(coincidenciaPila[1]) : null;
	const columnaPila = coincidenciaPila ? Number(coincidenciaPila[2]) : null;

	return crearElementoError('Sintactico', mensajeCrudo, lineaPila, columnaPila);
}

export async function POST({ request }) {
	let datosSolicitud;
	try {
		datosSolicitud = await request.json();
	} catch {
		return json(
			{
				ok: false,
				ast: null,
				errores: [crearElementoError('Validacion', 'El cuerpo de la solicitud no es JSON valido.')]
			},
			{ status: 400 }
		);
	}

	const textoFuente = datosSolicitud?.textoFuente;
	if (typeof textoFuente !== 'string' || textoFuente.trim().length === 0) {
		return json({
			ok: false,
			ast: null,
			errores: [crearElementoError('Validacion', 'La configuracion esta vacia.')]
		});
	}

	let parser;
	try {
		const jisonModule = await import('jison');
		const fabricaParser = obtenerFabricaParser(jisonModule);
		parser = new fabricaParser(wisonGrammarSource);
		parser.yy = {
			erroresLexicos: [],
			registrarErrorLexico(lexema, linea, columna) {
				this.erroresLexicos.push({
					tipo: 'lexico',
					lexema,
					linea,
					columna,
					mensaje: `Token no reconocido: ${lexema}`
				});
			}
		};
	} catch (error) {
		return json(
			{
				ok: false,
				ast: null,
				errores: [
					crearElementoError(
						'Infraestructura',
						`No se pudo inicializar Jison en servidor. Detalle: ${error.message}`
					)
				]
			},
			{ status: 500 }
		);
	}

	try {
		const ast = parser.parse(textoFuente);
		const erroresLexicosDelAst = mapearErroresEstructurados(ast?.errors?.lexical, 'Lexico');
		const erroresLexicosDelLexer = mapearErroresEstructurados(parser?.yy?.erroresLexicos, 'Lexico');
		const erroresLexicos = erroresLexicosDelAst.concat(erroresLexicosDelLexer);
		const erroresSintacticos = mapearErroresEstructurados(ast?.errors?.syntactic, 'Sintactico');
		const validacionSemantica = validarSemanticaWison(ast);
		const erroresSemanticos = mapearErroresEstructurados(validacionSemantica?.errores, 'Semantico');
		const errores = erroresLexicos.concat(erroresSintacticos, erroresSemanticos);

		let conjuntosPrimeroSiguiente = null;
		let tablaLl1 = null;
		let conflictosLl1 = null;
		if (errores.length === 0) {
			conjuntosPrimeroSiguiente = calcularPrimeroSiguiente(ast);
			const resultadoTabla = construirTablaLl1(ast, conjuntosPrimeroSiguiente);
			tablaLl1 = formatearTablaParseo(resultadoTabla.tabla);
			if (resultadoTabla.conflictos.length > 0) {
				conflictosLl1 = formatearConflictos(resultadoTabla.conflictos);
			}
		}

		return json({
			ok: errores.length === 0,
			ast,
			errores,
			conjuntosPrimeroSiguiente,
			tablaLl1,
			conflictosLl1
		});
	} catch (error) {
		return json({
			ok: false,
			ast: null,
			errores: [mapearErrorLanzadoParser(error)]
		});
	}
}
