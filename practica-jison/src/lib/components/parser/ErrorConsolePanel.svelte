<script>
  import Panel from "$lib/components/ui/Panel.svelte";

  const errors = [
    {
      type: "Sintactico",
      scope: "Construccion",
      detail: "Produccion Exp -> Exp + Term genera recursion izquierda.",
    },
    {
      type: "Semantico",
      scope: "Construccion",
      detail: "No terminal Factor definido pero no alcanzable.",
    },
    {
      type: "Lexico",
      scope: "Prueba",
      detail: 'Token "@" no reconocido en la posicion 14.',
    },
  ];
</script>

<Panel
  title="Consola de Errores"
  subtitle="Lexicos, sintacticos y semanticos"
  tone="alert"
>
  <!-- * Aqui se mostraran errores cuando el analizador funciones jsjsjs  -->
  <div class="error-list" role="log" aria-live="polite">
    {#each errors as item}
      <article>
        <header>
          <strong>{item.type}</strong>
          <span>{item.scope}</span>
        </header>
        <p>{item.detail}</p>
      </article>
    {/each}
  </div>
</Panel>

<style>
  .error-list {
    display: grid;
    gap: 0.55rem;
    max-height: 17rem;
    overflow: auto;
  }

  article {
    padding: 0.65rem;
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
    font: 700 0.78rem/1 var(--font-mono);
    color: #6f1f1f;
  }

  span {
    font: 600 0.69rem/1 var(--font-mono);
    padding: 0.22rem 0.42rem;
    border-radius: 999px;
    background: rgba(165, 36, 36, 0.12);
    color: #7f2a2a;
  }

  p {
    margin: 0;
    font: 500 0.8rem/1.35 var(--font-text);
    color: #572626;
  }
</style>
