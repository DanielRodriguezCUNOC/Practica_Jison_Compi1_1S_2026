<script>
  import Panel from "$lib/components/ui/Panel.svelte";

  //* Datos de ejemplo para ilustrar la funcionalidad
  const parsers = [
    { id: "arith_ll1", name: "Aritmetica Basica", status: "LISTO" },
    { id: "json_subset", name: "JSON Subconjunto", status: "LISTO" },
    { id: "if_else", name: "Sentencias IF/ELSE", status: "REVISION" },
  ];

  let selectedId = $state(parsers[0].id);
</script>

<!-- * Aqui se mostrarian los analizadores disponibles haciendo un request a
        la API XD -->
<Panel
  title="Analizadores Disponibles"
  subtitle="Selecciona uno para probar cadenas de entrada"
>
  <ul>
    {#each parsers as parser}
      <li class:selected={selectedId === parser.id}>
        <button type="button" onclick={() => (selectedId = parser.id)}
          >{parser.name}</button
        >

        <span>{parser.status}</span>
      </li>
    {/each}
  </ul>
</Panel>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.6rem;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.65rem;
    padding: 0.6rem;
    border: 1px solid rgba(25, 41, 74, 0.18);
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.66);
  }

  li.selected {
    border-color: rgba(209, 83, 30, 0.42);
    box-shadow: 0 6px 16px rgba(209, 83, 30, 0.16);
  }

  button {
    all: unset;
    cursor: pointer;
    font: 600 0.84rem/1.25 var(--font-text);
    color: var(--color-ink);
  }

  span {
    font: 600 0.68rem/1 var(--font-mono);
    padding: 0.32rem 0.5rem;
    border-radius: 999px;
    background: rgba(18, 36, 69, 0.12);
    color: #1e3160;
  }
</style>
