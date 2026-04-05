<script>
  import Panel from "$lib/components/ui/Panel.svelte";

  const tree = {
    value: "Exp",
    children: [
      {
        value: "Exp",
        children: [{ value: "Term", children: [{ value: "NUM(12)" }] }],
      },
      { value: "PLUS" },
      {
        value: "Term",
        children: [
          { value: "Term", children: [{ value: "NUM(8)" }] },
          { value: "TIMES" },
          { value: "Factor", children: [{ value: "LPAREN (Exp) RPAREN" }] },
        ],
      },
    ],
  };

  function flatten(node, depth = 0) {
    const current = [{ label: node.value, depth }];
    const nested = (node.children || []).flatMap((child) =>
      flatten(child, depth + 1),
    );
    return [...current, ...nested];
  }

  const nodes = flatten(tree);
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
    {#each nodes as node}
      <div class="tree-node" style={`--depth:${node.depth}`}>
        <span>{node.label}</span>
      </div>
    {/each}
  </div>
</Panel>

<style>
  .tree-canvas {
    padding: 0.4rem;
    display: grid;
    gap: 0.42rem;
    max-height: 22rem;
    overflow: auto;
  }

  .tree-node {
    padding-left: calc(var(--depth) * 1.2rem);
  }

  .tree-node span {
    display: inline-flex;
    align-items: center;
    padding: 0.38rem 0.55rem;
    border-radius: 0.55rem;
    border: 1px solid rgba(25, 41, 74, 0.2);
    background: rgba(255, 255, 255, 0.78);
    font: 600 0.78rem/1.2 var(--font-mono);
    color: var(--color-ink);
  }
</style>
