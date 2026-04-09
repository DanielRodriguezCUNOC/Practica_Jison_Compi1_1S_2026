<script>
	import { onMount } from 'svelte';
	import Panel from "$lib/components/ui/Panel.svelte";
	import { evaluarConfiguracionWison } from "$lib/services/jison-service";
	import { guardarAnalizadorApi } from '$lib/services/api-client';
	import {
		limpiarErroresDelAnalizador,
		establecerErroresDelAnalizador,
	} from "$lib/stores/error-store";
	import { estadoDelAnalizador, establecerEstadoDelAnalizador } from "$lib/stores/app-store";
	import { generarParserDescendente } from "$lib/wison/recursive-descent-generator";
	import { inyectarParserEnCaliente } from "$lib/services/parser-api";

	let sampleGrammar = $state(`Wison ?
Lex {:
Terminal $_ID <- 'id';
Terminal $_PLUS <- '+';
:}
Syntax {{:
No_Terminal %_E;
Initial_Sim %_E;
%_E <= $_ID | $_ID $_PLUS $_ID;
:}}
? Wison`);
	let isEvaluating = $state(false);
	let isSaving = $state(false);
	let feedback = $state("");
	let areaEditor = $state();
	let lineaEditor = $state();

	function obtenerNumerosDeLinea(texto) {
		const totalLineas = Math.max(1, texto.split("\n").length);
		const numeros = [];

		for (let i = 1; i <= totalLineas; i += 1) {
			numeros.push(i);
		}

		return numeros;
	}

	function sincronizarNumerosDeLinea(event) {
		if (lineaEditor) {
			lineaEditor.scrollTop = event.currentTarget.scrollTop;
		}
	}

	onMount(() => {
		const cancelar = estadoDelAnalizador.subscribe((estadoActual) => {
			const fuenteRemota = estadoActual?.wisonFuenteSeleccionada;
			if (typeof fuenteRemota === 'string' && fuenteRemota.length > 0 && fuenteRemota !== sampleGrammar) {
				sampleGrammar = fuenteRemota;
				const nombre = estadoActual?.analizadorSeleccionadoNombre || 'sin nombre';
				feedback = `Analizador cargado desde API: ${nombre}`;
			}
		});

		return () => {
			cancelar();
		};
	});

	async function onGuardarAnalizador() {
		if (typeof sampleGrammar !== 'string' || sampleGrammar.trim().length === 0) {
			feedback = 'No puedes guardar una configuracion vacia.';
			return;
		}

		const nombreIngresado = prompt('Nombre del analizador:');
		if (!nombreIngresado || nombreIngresado.trim().length === 0) {
			feedback = 'Guardado cancelado: nombre vacio.';
			return;
		}

		isSaving = true;
		try {
			const respuesta = await guardarAnalizadorApi(nombreIngresado.trim(), sampleGrammar);
			establecerEstadoDelAnalizador({
				analizadorSeleccionadoId: respuesta?.id ?? null,
				analizadorSeleccionadoNombre: nombreIngresado.trim()
			});
			feedback = respuesta?.mensaje ?? 'Analizador guardado correctamente.';
		} catch (error) {
			feedback = `Error al guardar: ${error.message}`;
		} finally {
			isSaving = false;
		}
	}

	async function onEvaluateConfiguration() {
		// Activa modo de evaluacion en UI.
		isEvaluating = true;
		feedback = "";
		limpiarErroresDelAnalizador();

		// Llama al backend para validar la configuracion completa.
		const resultado = await evaluarConfiguracionWison(sampleGrammar);
		establecerErroresDelAnalizador(resultado.errores);

		// Evalua si hay conflictos en la tabla LL(1).
		let hayConflictosLl1 = false;
		if (Array.isArray(resultado.conflictosLl1) && resultado.conflictosLl1.length > 0) {
			hayConflictosLl1 = true;
		}

		if (resultado.ok && !hayConflictosLl1) {
			// Intenta generar e inyectar el parser.
			try {
				// Genera el codigo Typescript/JavaScript del parser.
				const codigoParserFuente = generarParserDescendente(
					resultado.ast,
					resultado.tablaLl1
				);
				
				// Inyecta el parser en caliente.
				const instanciaParser = inyectarParserEnCaliente(codigoParserFuente);
				
				// Guarda estado exitoso con el parser inyectado.
				establecerEstadoDelAnalizador({
					status: "success",
					ast: resultado.ast,
					message: "Configuracion valida, parser generado e inyectado.",
					conjuntosPrimeroSiguiente: resultado.conjuntosPrimeroSiguiente,
					tablaLl1: resultado.tablaLl1,
					conflictosLl1: resultado.conflictosLl1,
					parserGeneradoFuente: codigoParserFuente,
					parserGeneradoInstancia: instanciaParser
				});
				feedback = "Parser generado e inyectado exitosamente.";
			} catch (error) {
				// Error durante generacion o inyeccion del parser.
				establecerEstadoDelAnalizador({
					status: "error",
					ast: resultado.ast,
					message: `Error al generar parser: ${error.message}`,
					conjuntosPrimeroSiguiente: resultado.conjuntosPrimeroSiguiente,
					tablaLl1: resultado.tablaLl1,
					conflictosLl1: resultado.conflictosLl1,
				});
				feedback = `Error: ${error.message}`;
				establecerErroresDelAnalizador([{
					type: 'Infraestructura',
					scope: 'ParserGenerador',
					detail: error.message
				}]);
			}
		} else if (resultado.ok && hayConflictosLl1) {
			// Guarda estado de error funcional cuando la gramatica no es LL(1).
			establecerEstadoDelAnalizador({
				status: "error",
				ast: resultado.ast,
				message: `La gramatica tiene ${resultado.conflictosLl1.length} conflicto(s) LL(1).`,
				conjuntosPrimeroSiguiente: resultado.conjuntosPrimeroSiguiente,
				tablaLl1: resultado.tablaLl1,
				conflictosLl1: resultado.conflictosLl1,
			});
			feedback = `Gramatica no LL(1): ${resultado.conflictosLl1.length} conflicto(s).`;
		} else {
			// Guarda errores de validacion/parseo de la configuracion.
			establecerEstadoDelAnalizador({
				status: "error",
				ast: resultado.ast,
				message: `Se detectaron ${resultado.errores.length} error(es).`,
				conjuntosPrimeroSiguiente: resultado.conjuntosPrimeroSiguiente,
				tablaLl1: resultado.tablaLl1,
				conflictosLl1: resultado.conflictosLl1,
			});
			feedback = `Se detectaron ${resultado.errores.length} error(es).`;
		}

		// Desactiva modo de evaluacion al finalizar.
		isEvaluating = false;
	}

	async function onFileSelected(event) {
		const input = event.currentTarget;
		const file = input?.files?.[0];
		if (!file) return;

		const fileContent = await file.text();
		sampleGrammar = fileContent;
		feedback = `Archivo cargado: ${file.name}`;
	}
</script>

<Panel
	title="Definicion del Analizador"
	subtitle="Escribe o carga una configuracion de gramatica"
	tone="accent"
>
	{#snippet actions()}
		<button
			type="button"
			onclick={onGuardarAnalizador}
			disabled={isSaving}
		>
			{isSaving ? 'Guardando...' : 'Guardar Analizador'}
		</button>
		<button
			type="button"
			onclick={onEvaluateConfiguration}
			disabled={isEvaluating}
		>
			{isEvaluating ? "Evaluando..." : "Evaluar Configuracion"}
		</button>
	{/snippet}

	<div class="toolbar">
		<label class="file-upload">
			<input
				type="file"
				accept=".wison,.txt,.jison"
				onchange={onFileSelected}
			/>
			<span>Cargar archivo</span>
		</label>
		<span class="hint">Se admiten archivos .jison y .txt</span>
	</div>

	{#if feedback}
		<p class="feedback">{feedback}</p>
	{/if}

	<label for="grammar-editor" class="editor-label"
		>Editor de configuracion</label
	>
	<div class="editor-shell">
		<div class="line-numbers" bind:this={lineaEditor} aria-hidden="true">
			{#each obtenerNumerosDeLinea(sampleGrammar) as numero}
				<span>{numero}</span>
			{/each}
		</div>
		<textarea
			id="grammar-editor"
			rows="18"
			bind:this={areaEditor}
			bind:value={sampleGrammar}
			onscroll={sincronizarNumerosDeLinea}
			spellcheck="false"
		></textarea>
	</div>
</Panel>

<style>
	.editor-shell {
		display: grid;
		grid-template-columns: 3.75rem minmax(0, 1fr);
		align-items: stretch;
		border: 1px solid rgba(25, 41, 74, 0.2);
		border-radius: 0.9rem;
		overflow: hidden;
		background: #111c35;
		min-height: 31rem;
	}

	.line-numbers {
		display: grid;
		align-content: start;
		padding: 0.9rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-right: 1px solid rgba(255, 255, 255, 0.08);
		color: rgba(239, 243, 255, 0.5);
		font: 600 0.8rem/1.52 var(--font-mono);
		text-align: right;
		user-select: none;
		overflow: auto;
		scrollbar-width: none;
	}

	.line-numbers::-webkit-scrollbar {
		display: none;
	}

	.line-numbers span {
		display: block;
		padding-right: 0.25rem;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		align-items: center;
		margin-bottom: 0.9rem;
	}

	.file-upload {
		position: relative;
		overflow: hidden;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.42rem 0.82rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(25, 41, 74, 0.25);
		font: 600 0.78rem/1 var(--font-mono);
		cursor: pointer;
	}

	.file-upload input {
		position: absolute;
		opacity: 0;
		inset: 0;
		cursor: pointer;
	}

	.hint {
		font: 500 0.75rem/1.25 var(--font-text);
		color: var(--color-ink-soft);
	}

	.feedback {
		margin: 0 0 0.7rem;
		font: 600 0.78rem/1.35 var(--font-text);
		color: var(--color-ink);
	}

	.editor-label {
		display: block;
		margin-bottom: 0.42rem;
		font: 600 0.78rem/1.2 var(--font-mono);
		letter-spacing: 0.02em;
		color: var(--color-ink);
	}

	textarea {
		width: 100%;
		height: 100%;
		min-height: 31rem;
		border: 0;
		border-radius: 0;
		background: transparent;
		color: #eff3ff;
		font: 500 0.88rem/1.55 var(--font-mono);
		padding: 0.9rem 1rem;
		resize: vertical;
		outline: none;
		white-space: pre;
		overflow: auto;
	}

	textarea::selection {
		background: rgba(240, 163, 74, 0.35);
	}

	button {
		border: 0;
		border-radius: 0.6rem;
		padding: 0.45rem 0.85rem;
		font: 700 0.73rem/1 var(--font-mono);
		letter-spacing: 0.02em;
		background: var(--color-accent);
		color: #231207;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}
</style>
