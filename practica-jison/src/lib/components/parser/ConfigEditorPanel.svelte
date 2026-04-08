<script>
	import Panel from '$lib/components/ui/Panel.svelte';
	import { evaluarConfiguracionWison } from '$lib/services/jison-service';
	import { limpiarErroresDelAnalizador, establecerErroresDelAnalizador } from '$lib/stores/error-store';
	import { establecerEstadoDelAnalizador } from '$lib/stores/app-store';

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
	let feedback = $state('');

	async function onEvaluateConfiguration() {
		isEvaluating = true;
		feedback = '';
		limpiarErroresDelAnalizador();

		const resultado = await evaluarConfiguracionWison(sampleGrammar);
		establecerErroresDelAnalizador(resultado.errores);

		if (resultado.ok) {
			establecerEstadoDelAnalizador({
				status: 'success',
				ast: resultado.ast,
				message: 'Configuración válida.'
			});
			feedback = 'Configuración válida.';
		} else {
			establecerEstadoDelAnalizador({
				status: 'error',
				ast: resultado.ast,
				message: `Se detectaron ${resultado.errores.length} error(es).`
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
</script>

<Panel title="Definicion del Analizador" subtitle="Escribe o carga una configuracion de gramatica" tone="accent">
	{#snippet actions()}
		<button type="button" onclick={onEvaluateConfiguration} disabled={isEvaluating}>
			{isEvaluating ? 'Evaluando...' : 'Evaluar Configuracion'}
		</button>
	{/snippet}

	<div class="toolbar">
		<label class="file-upload">
			<input type="file" accept=".wison,.txt,.jison" onchange={onFileSelected} />
			<span>Cargar archivo</span>
		</label>
		<span class="hint">Se admiten archivos .jison y .txt</span>
	</div>

	{#if feedback}
		<p class="feedback">{feedback}</p>
	{/if}

	<label for="grammar-editor" class="editor-label">Editor de configuracion</label>
	<textarea id="grammar-editor" rows="14" bind:value={sampleGrammar} spellcheck="false"></textarea>
</Panel>

<style>
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
		min-height: 18rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(25, 41, 74, 0.2);
		background: #111c35;
		color: #eff3ff;
		font: 500 0.83rem/1.5 var(--font-mono);
		padding: 0.9rem;
		resize: vertical;
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