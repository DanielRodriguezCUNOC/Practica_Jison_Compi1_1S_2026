<script>
  import Panel from "$lib/components/ui/Panel.svelte";

  let inputText = $state("12 + 8 * (7 - 4)");
</script>

<Panel
  title="Prueba de Cadena"
  subtitle="Ingresa la entrada para el analizador seleccionado"
>
  {#snippet actions()}
    <button type="button">Analizar Entrada</button>
  {/snippet}

  <label for="input-editor">Editor de entrada</label>
  <textarea id="input-editor" rows="7" bind:value={inputText} spellcheck="false"
  ></textarea>
</Panel>

<style>
  label {
    display: block;
    margin-bottom: 0.42rem;
    font: 600 0.78rem/1.2 var(--font-mono);
    letter-spacing: 0.02em;
    color: var(--color-ink);
  }

  textarea {
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid rgba(25, 41, 74, 0.2);
    background: #101a33;
    color: #f2f6ff;
    font: 500 0.88rem/1.45 var(--font-mono);
    padding: 0.9rem;
    resize: vertical;
    min-height: 9.5rem;
  }

  button {
    border: 0;
    border-radius: 0.6rem;
    padding: 0.45rem 0.85rem;
    font: 700 0.73rem/1 var(--font-mono);
    letter-spacing: 0.02em;
    background: #2f9c76;
    color: #082116;
    cursor: pointer;
  }
</style>
