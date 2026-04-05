<script>
  let {
    url = "https://github.com/DanielRodriguezCUNOC/Practica_Jison_Compi1_1S_2026.git",
    text = "Repositorio",
  } = $props();

  const openGitHub = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };
</script>

<span
  class="github-link"
  onclick={openGitHub}
  onkeydown={(e) => e.key === "Enter" && openGitHub()}
  role="button"
  tabindex="0"
  aria-label="Abrir repositorio en GitHub"
>
  <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
    />
  </svg>
  {text}
</span>

<style>
  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.38rem 0.65rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.17);
    font: 600 0.92rem/1 var(--font-mono);
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .github-link:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }

  .github-icon {
    width: 20px;
    height: 20px;
  }

  .github-link:hover .github-icon {
    transform: scale(1.1);
  }
</style>
