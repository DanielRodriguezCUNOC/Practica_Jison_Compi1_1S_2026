<script>
	import Panel from "$lib/components/ui/Panel.svelte";
	import { compilarAnalizadorWison } from "$lib/services/jison-service";
	import { guardarAnalizadorApi } from "$lib/services/api-client";
	import {
		limpiarErroresDelAnalizador,
		establecerErroresDelAnalizador,
	} from "$lib/stores/error-store";
	import { establecerEstadoDelAnalizador } from "$lib/stores/app-store";

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
	let nombreAnalizador = $state("");
	let areaEditor = $state();
	let lineaEditor = $state();

	function tienaNombreValido() {
		return nombreAnalizador && nombreAnalizador.trim().length > 0;
	}

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

	async function onEvaluateConfiguration() {
		isEvaluating = true;
		feedback = "";
		limpiarErroresDelAnalizador();

		const resultado = await compilarAnalizadorWison(sampleGrammar);
		establecerErroresDelAnalizador(resultado.errores);

		if (resultado.ok) {
			establecerEstadoDelAnalizador({
				status: "success",
				ast: resultado.ast,
				conjuntosPrimeroSiguiente: resultado.conjuntosPrimeroSiguiente,
				tablaLl1: resultado.tablaLl1,
				conflictosLl1: resultado.conflictosLl1,
				parserGeneradoFuente: resultado.parserGeneradoFuente,
				parserGeneradoInstancia: resultado.parserGeneradoInstancia,
				message: "Configuración válida.",
			});
			feedback = "Configuración válida y analizador listo.";
		} else {
			establecerEstadoDelAnalizador({
				status: "error",
				ast: resultado.ast,
				message: `Se detectaron ${resultado.errores.length} error(es).`,
			});
			feedback = `Se detectaron ${resultado.errores.length} error(es).`;
		}

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

	async function onGuardarAnalizador() {
		if (!nombreAnalizador.trim()) {
			feedback = "Por favor ingresa un nombre para el analizador.";
			return;
		}

		isSaving = true;
		feedback = "";

		try {
			await guardarAnalizadorApi(nombreAnalizador.trim(), sampleGrammar);
			feedback = `Analizador "${nombreAnalizador}" guardado exitosamente.`;
			nombreAnalizador = "";
		} catch (error) {
			feedback = `Error al guardar: ${error.message || "Error desconocido"}`;
		} finally {
			isSaving = false;
		}
	}
</script>

<Panel
	title="Definicion del Analizador"
	subtitle="Escribe o carga una configuracion de gramatica"
	tone="accent"
>
	{#snippet actions()}
		<div class="button-group">
			<button
				type="button"
				onclick={onEvaluateConfiguration}
				disabled={isEvaluating}
			>
				{isEvaluating ? "Evaluando..." : "Evaluar Configuracion"}
			</button>
			<button
				type="button"
				onclick={onGuardarAnalizador}
				disabled={isSaving || !tienaNombreValido()}
				class="save-button"
			>
				{isSaving ? "Guardando..." : "Guardar en BD"}
			</button>
		</div>
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
		<input
			type="text"
			bind:value={nombreAnalizador}
			placeholder="Nombre del analizador (para guardar en BD)"
			class="nombre-input"
		/>
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

	.button-group {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}

	.save-button {
		background: var(--color-accent-alt, #4ade80);
	}

	.nombre-input {
		flex: 1;
		min-width: 15rem;
		padding: 0.45rem 0.65rem;
		border: 1px solid rgba(25, 41, 74, 0.25);
		border-radius: 0.6rem;
		font: 500 0.78rem/1.2 var(--font-mono);
		outline: none;
	}

	.nombre-input::placeholder {
		color: rgba(239, 243, 255, 0.4);
	}

	.nombre-input:focus {
		border-color: var(--color-accent);
		background: rgba(240, 163, 74, 0.1);
	}
</style>
