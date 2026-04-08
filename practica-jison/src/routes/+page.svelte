<script>
  import MainHeader from "$lib/components/layout/MainHeader.svelte";
  import ConfigEditorPanel from "$lib/components/parser/ConfigEditorPanel.svelte";
  import ParserListPanel from "$lib/components/parser/ParserListPanel.svelte";
  import InputEditorPanel from "$lib/components/parser/InputEditorPanel.svelte";
  import TreeViewerPanel from "$lib/components/parser/TreeViewerPanel.svelte";
  import ErrorConsolePanel from "$lib/components/parser/ErrorConsolePanel.svelte";
</script>

<main class="workspace">
  <MainHeader />

  <section class="workspace-grid" aria-label="Zona de trabajo principal">
    <div class="stack stack--left">
      <ConfigEditorPanel />
      <InputEditorPanel />
    </div>

    <div class="stack stack--right">
      <ParserListPanel />
      <TreeViewerPanel />
      <ErrorConsolePanel />
    </div>
  </section>
</main>

<style>
  .workspace {
    width: min(100%, 1600px);
    max-width: 1600px;
    margin: 0 auto;
    padding: clamp(1rem, 2vw, 1.8rem);
    display: grid;
    gap: 1.15rem;
  }

  .workspace-grid {
    display: grid;
    gap: 1.15rem;
  }

  .stack {
    display: grid;
    gap: 1.15rem;
    align-content: start;
  }

  @media (min-width: 960px) {
    .workspace-grid {
      grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
    }
  }
</style>
