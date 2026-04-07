import { json } from '@sveltejs/kit';
import wisonGrammarSource from '$lib/wison/wison-grammar.jison?raw';

function toErrorItem(type, detail, line = null, column = null) {
	const position = line != null && column != null ? ` (L${line}, C${column})` : '';
	return {
		type,
		scope: 'Configuracion',
		detail: `${detail}${position}`
	};
}

function getParserFactory(jisonModule) {
	const Jison = jisonModule?.default ?? jisonModule;
	const parserFactory = Jison?.Parser ?? Jison?.Generator ?? Jison;

	if (typeof parserFactory !== 'function') {
		throw new Error('El paquete jison no expone un constructor compatible.');
	}

	return parserFactory;
}

function mapStructuredErrors(errors = [], label) {
	return errors.map((item) =>
		toErrorItem(
			label,
			item?.mensaje ?? 'Error no especificado.',
			item?.linea ?? null,
			item?.columna ?? null
		)
	);
}

function mapThrownParserError(error) {
	const rawMessage = String(error?.message ?? 'Error de analisis no controlado.');
	if (/is not defined/i.test(rawMessage)) {
		return toErrorItem(
			'Infraestructura',
			`Error interno del evaluador de Wison. No es un error de tu archivo. Detalle tecnico: ${rawMessage}`
		);
	}

	const fromHashLine = error?.hash?.loc?.first_line ?? null;
	const fromHashColumn = error?.hash?.loc?.first_column ?? null;

	if (fromHashLine != null && fromHashColumn != null) {
		return toErrorItem('Sintactico', rawMessage, fromHashLine, fromHashColumn + 1);
	}

	const stackMatch = String(error?.stack ?? '').match(/:(\d+):(\d+)\)?(?:\n|$)/);
	const stackLine = stackMatch ? Number(stackMatch[1]) : null;
	const stackColumn = stackMatch ? Number(stackMatch[2]) : null;

	return toErrorItem('Sintactico', rawMessage, stackLine, stackColumn);
}

export async function POST({ request }) {
	let payload;
	try {
		payload = await request.json();
	} catch {
		return json(
			{
				ok: false,
				ast: null,
				errors: [toErrorItem('Validacion', 'El cuerpo de la solicitud no es JSON valido.')]
			},
			{ status: 400 }
		);
	}

	const sourceText = payload?.sourceText;
	if (typeof sourceText !== 'string' || sourceText.trim().length === 0) {
		return json({
			ok: false,
			ast: null,
			errors: [toErrorItem('Validacion', 'La configuracion esta vacia.')]
		});
	}

	let parser;
	try {
		const jisonModule = await import('jison');
		const parserFactory = getParserFactory(jisonModule);
		parser = new parserFactory(wisonGrammarSource);
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
				errors: [
					toErrorItem(
						'Infraestructura',
						`No se pudo inicializar Jison en servidor. Detalle: ${error.message}`
					)
				]
			},
			{ status: 500 }
		);
	}

	try {
		const ast = parser.parse(sourceText);
		const lexicalErrorsFromAst = mapStructuredErrors(ast?.errors?.lexical, 'Lexico');
		const lexicalErrorsFromLexer = mapStructuredErrors(parser?.yy?.erroresLexicos, 'Lexico');
		const lexicalErrors = lexicalErrorsFromAst.concat(lexicalErrorsFromLexer);
		const syntacticErrors = mapStructuredErrors(ast?.errors?.syntactic, 'Sintactico');
		const errors = lexicalErrors.concat(syntacticErrors);

		return json({
			ok: errors.length === 0,
			ast,
			errors
		});
	} catch (error) {
		return json({
			ok: false,
			ast: null,
			errors: [mapThrownParserError(error)]
		});
	}
}
