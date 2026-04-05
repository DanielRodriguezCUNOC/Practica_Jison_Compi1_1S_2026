<script>
  import GithubLink from "../ui/github-link.svelte";
</script>

<header class="main-header">
  <div>
    <p class="main-header__eyebrow">Laboratorio de Compiladores 1</p>
    <h1>Constructor y Probador de Analizadores Sintacticos</h1>
    <p class="main-header__description">
      Define gramaticas, valida reglas LL y visualiza derivaciones.
    </p>
  </div>

  <div class="main-header__status">
    <GithubLink></GithubLink>
  </div>
</header>

<style>
  .main-header {
    display: grid;
    gap: 1rem;
    padding: 1.3rem;
    border-radius: 2rem;
    background: radial-gradient(
        circle at 85% 20%,
        rgba(255, 169, 119, 0.35) 0 15%,
        transparent 40%
      ),
      linear-gradient(125deg, #122445 0%, #183267 60%, #21488f 100%);
    color: #f6f8ff;
    box-shadow: 0 18px 38px rgba(8, 20, 51, 0.4);
  }

  .main-header__eyebrow {
    margin: 0;
    text-transform: uppercase;
    font: 500 0.72rem/1.2 var(--font-mono);
    letter-spacing: 0.11em;
    opacity: 0.9;
  }

  h1 {
    margin: 0.35rem 0 0;
    font: 700 clamp(1.45rem, 3vw, 2.1rem) / 1.1 var(--font-display);
  }

  .main-header__description {
    margin: 0.65rem 0 0;
    font: 500 0.93rem/1.45 var(--font-text);
    opacity: 0.94;
  }

  .main-header__status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  @media (min-width: 920px) {
    .main-header {
      grid-template-columns: 1fr auto;
      align-items: start;
    }
  }
</style>
