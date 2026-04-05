<script>
	import Panel from '$lib/components/ui/Panel.svelte';

	let sampleGrammar = $state(`%token NUM PLUS MINUS TIMES DIV LPAREN RPAREN
%start Exp

%%
Exp
  : Exp PLUS Term
  | Exp MINUS Term
  | Term
  ;

Term
  : Term TIMES Factor
  | Term DIV Factor
  | Factor
  ;

Factor
  : NUM
  | LPAREN Exp RPAREN
	;`);
</script>

<Panel title="Definicion del Analizador" subtitle="Escribe o carga una configuracion de gramatica" tone="accent">
	{#snippet actions()}
		<button type="button">Evaluar Configuracion</button>
	{/snippet}

	<div class="toolbar">
		<label class="file-upload">
			<input type="file" accept=".jison,.txt" />
			<span>Cargar archivo</span>
		</label>
		<span class="hint">Se admiten archivos .jison y .txt</span>
	</div>

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
</style>