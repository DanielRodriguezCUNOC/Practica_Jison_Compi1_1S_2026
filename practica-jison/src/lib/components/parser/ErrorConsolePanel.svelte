<script>
  import Panel from "$lib/components/ui/Panel.svelte";
  import { erroresDelAnalizador } from "$lib/stores/error-store";
</script>

<Panel
  title="Consola de Errores"
  subtitle="Lexicos, sintacticos y semanticos"
  tone="alert"
>
  <div class="error-list" role="log" aria-live="polite">
    {#if $erroresDelAnalizador.length === 0}
      <article class="empty">
        <p>No hay errores para mostrar.</p>
      </article>
    {:else}
      {#each $erroresDelAnalizador as item}
        <article>
          <header>
            <strong>{item.type}</strong>
            <span>{item.scope}</span>
          </header>
          <p>{item.detail}</p>
        </article>
      {/each}
    {/if}
  </div>
</Panel>

<style>
  .error-list {
    display: grid;
    gap: 0.55rem;
    min-height: 18rem;
    max-height: 28rem;
    overflow: auto;
    padding-right: 0.1rem;
  }

  article {
    padding: 0.8rem 0.85rem;
    border-radius: 0.72rem;
    border: 1px solid rgba(165, 36, 36, 0.26);
    background: rgba(255, 243, 242, 0.85);
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 0.6rem;
    margin-bottom: 0.28rem;
  }

  strong {
    font: 700 0.82rem/1 var(--font-mono);
    color: #6f1f1f;
  }

  span {
    font: 600 0.72rem/1 var(--font-mono);
    padding: 0.24rem 0.48rem;
    border-radius: 999px;
    background: rgba(165, 36, 36, 0.12);
    color: #7f2a2a;
  }

  p {
    margin: 0;
    font: 500 0.84rem/1.42 var(--font-text);
    color: #572626;
  }

  .empty {
    border-color: rgba(25, 41, 74, 0.2);
    background: rgba(255, 255, 255, 0.85);
  }

  .empty p {
    color: var(--color-ink-soft);
  }
</style>
