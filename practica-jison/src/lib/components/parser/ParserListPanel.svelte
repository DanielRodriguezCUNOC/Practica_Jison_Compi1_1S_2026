<script>
  import { onMount } from "svelte";
  import Panel from "$lib/components/ui/Panel.svelte";
  import { compilarAnalizadorWison } from "$lib/services/jison-service";
  import {
    listarAnalizadoresApi,
    obtenerAnalizadorApi,
  } from "$lib/services/api-client";
  import {
    limpiarErroresDelAnalizador,
    establecerErroresDelAnalizador,
  } from "$lib/stores/error-store";
  import { establecerEstadoDelAnalizador } from "$lib/stores/app-store";

  let parsers = $state([]);
  let selectedId = $state(null);
  let cargandoLista = $state(false);
  let cargandoItem = $state(false);
  let mensaje = $state("");

  async function onRecargarLista() {
    cargandoLista = true;
    mensaje = "";
    try {
      const items = await listarAnalizadoresApi();
      parsers = items.map((item) => ({
        id: item.id,
        name: item.nombre,
        status: "GUARDADO",
        fechaCreacion: item.fechaCreacion,
      }));

      if (parsers.length > 0 && selectedId == null) {
        selectedId = parsers[0].id;
      }

      if (parsers.length === 0) {
        mensaje = "No hay analizadores guardados.";
      }
    } catch (error) {
      mensaje = `Error al listar: ${error.message}`;
    } finally {
      cargandoLista = false;
    }
  }

  async function onCargarSeleccionado() {
    if (selectedId == null) {
      mensaje = "Selecciona un analizador de la lista.";
      return;
    }

    cargandoItem = true;
    mensaje = "";
    limpiarErroresDelAnalizador();
    try {
      const data = await obtenerAnalizadorApi(selectedId);
      console.log(data);

      const resultado = await compilarAnalizadorWison(data?.wisonSource ?? "");
      establecerErroresDelAnalizador(resultado.errores);

      if (!resultado.ok) {
        establecerEstadoDelAnalizador({
          status: "error",
          analizadorSeleccionadoId: data?.id ?? selectedId,
          analizadorSeleccionadoNombre: data?.nombre ?? "",
          wisonFuenteSeleccionada: data?.wisonSource ?? "",
          parserGeneradoFuente: "",
          parserGeneradoInstancia: null,
        });
        mensaje = `No se pudo compilar: ${resultado.errores.length} error(es).`;
        return;
      }

      establecerEstadoDelAnalizador({
        status: "success",
        ast: resultado.ast,
        conjuntosPrimeroSiguiente: resultado.conjuntosPrimeroSiguiente,
        tablaLl1: resultado.tablaLl1,
        conflictosLl1: resultado.conflictosLl1,
        parserGeneradoFuente: resultado.parserGeneradoFuente,
        parserGeneradoInstancia: resultado.parserGeneradoInstancia,
        analizadorSeleccionadoId: data?.id ?? selectedId,
        analizadorSeleccionadoNombre: data?.nombre ?? "",
        wisonFuenteSeleccionada: data?.wisonSource ?? "",
      });
      mensaje = `Analizador cargado y compilado: ${data?.nombre ?? selectedId}`;
    } catch (error) {
      mensaje = `Error al cargar: ${error.message}`;
    } finally {
      cargandoItem = false;
    }
  }

  onMount(() => {
    onRecargarLista();
  });
</script>

<Panel
  title="Analizadores Disponibles"
  subtitle="Selecciona uno para probar cadenas de entrada"
>
  {#snippet actions()}
    <button
      type="button"
      class="action-button"
      onclick={onRecargarLista}
      disabled={cargandoLista}
    >
      {cargandoLista ? "Recargando..." : "Recargar"}
    </button>
    <button
      type="button"
      class="action-button"
      onclick={onCargarSeleccionado}
      disabled={cargandoItem || selectedId == null}
    >
      {cargandoItem ? "Cargando..." : "Cargar al Editor"}
    </button>
  {/snippet}

  {#if mensaje}
    <p class="mensaje">{mensaje}</p>
  {/if}

  <ul>
    {#each parsers as parser}
      <li class:selected={selectedId === parser.id}>
        <button
          type="button"
          class="parser-button"
          onclick={() => (selectedId = parser.id)}>{parser.name}</button
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

  .action-button {
    border: 0;
    border-radius: 0.6rem;
    padding: 0.45rem 0.85rem;
    font: 700 0.73rem/1 var(--font-mono);
    letter-spacing: 0.02em;
    background: var(--color-accent);
    color: #231207;
    cursor: pointer;
  }

  .action-button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .parser-button {
    all: unset;
    cursor: pointer;
    font: 600 0.84rem/1.25 var(--font-text);
    color: var(--color-ink);
  }

  .parser-button:hover {
    color: #8d3915;
  }

  .parser-button:focus-visible {
    outline: 2px solid rgba(209, 83, 30, 0.45);
    outline-offset: 2px;
    border-radius: 0.3rem;
  }

  span {
    font: 600 0.68rem/1 var(--font-mono);
    padding: 0.32rem 0.5rem;
    border-radius: 999px;
    background: rgba(18, 36, 69, 0.12);
    color: #1e3160;
  }

  .mensaje {
    margin: 0 0 0.6rem;
    font: 600 0.78rem/1.35 var(--font-text);
    color: var(--color-ink);
  }
</style>
