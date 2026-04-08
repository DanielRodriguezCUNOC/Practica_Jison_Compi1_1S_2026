<script>
  import Panel from "$lib/components/ui/Panel.svelte";
  import { estadoDelAnalizador } from "$lib/stores/app-store";
</script>

<Panel
  title="Arbol de Derivacion"
  subtitle="Vista preliminar cuando una cadena es aceptada"
>
  <div
    class="tree-canvas"
    role="img"
    aria-label="Arbol de derivacion de ejemplo"
  >
    {#if !$estadoDelAnalizador.ast}
      <p class="empty">
        Aun no hay AST. Evalua una configuracion para verlo aqui.
      </p>
    {:else}
      <pre>{JSON.stringify($estadoDelAnalizador.ast, null, 2)}</pre>
    {/if}
  </div>
</Panel>

<style>
  .tree-canvas {
    padding: 0.5rem;
    display: grid;
    gap: 0.42rem;
    min-height: 20rem;
    max-height: 32rem;
    overflow: auto;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    border-radius: 0.8rem;
    border: 1px solid rgba(25, 41, 74, 0.2);
    background: rgba(255, 255, 255, 0.78);
    padding: 0.9rem;
    min-height: 18rem;
    font: 500 0.82rem/1.5 var(--font-mono);
    color: var(--color-ink);
  }

  .empty {
    margin: 0;
    font: 500 0.9rem/1.45 var(--font-text);
    color: var(--color-ink-soft);
  }
</style>
