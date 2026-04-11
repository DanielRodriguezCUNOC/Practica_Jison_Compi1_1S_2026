<script>
  import Panel from "$lib/components/ui/Panel.svelte";
  import { estadoDelAnalizador } from "$lib/stores/app-store";
  import { construirArbolSvgDesdeEstado } from "$lib/utils/tree-builder";

  const arbolDibujable = $derived(construirArbolSvgDesdeEstado($estadoDelAnalizador));
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
    {#if !arbolDibujable}
      <p class="empty">
        Aun no hay AST. Evalua una configuracion para verlo aqui.
      </p>
    {:else}
      <p class="hint">Fuente: {arbolDibujable.source}</p>
      <div class="svg-shell">
        <svg
          viewBox={`0 0 ${arbolDibujable.width} ${arbolDibujable.height}`}
          width={arbolDibujable.width}
          height={arbolDibujable.height}
          aria-label="Arbol de derivacion renderizado"
        >
          {#each arbolDibujable.edges as edge}
            <line
              x1={edge.fromX}
              y1={edge.fromY}
              x2={edge.toX}
              y2={edge.toY}
              class="edge"
            />
          {/each}

          {#each arbolDibujable.nodes as node}
            <g transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}>
              <rect
                width={node.width}
                height={node.height}
                rx="8"
                ry="8"
                class="node-box"
              />
              <text
                x={node.width / 2}
                y={node.height / 2}
                dominant-baseline="middle"
                text-anchor="middle"
                class="node-label"
              >
                {node.label}
              </text>
            </g>
          {/each}
        </svg>
      </div>
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

  .svg-shell {
    width: 100%;
    overflow: auto;
    border-radius: 0.8rem;
    border: 1px solid rgba(25, 41, 74, 0.18);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(246, 250, 255, 0.82));
    padding: 0.6rem;
  }

  svg {
    display: block;
  }

  .edge {
    stroke: #7f96b8;
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  .node-box {
    fill: #f8fbff;
    stroke: #2f5482;
    stroke-width: 1.2;
  }

  .node-label {
    font: 600 0.72rem/1 var(--font-mono);
    fill: #132743;
    pointer-events: none;
  }

  .hint {
    margin: 0;
    font: 600 0.74rem/1.25 var(--font-mono);
    color: #2f5482;
  }

  .empty {
    margin: 0;
    font: 500 0.9rem/1.45 var(--font-text);
    color: var(--color-ink-soft);
  }
</style>
