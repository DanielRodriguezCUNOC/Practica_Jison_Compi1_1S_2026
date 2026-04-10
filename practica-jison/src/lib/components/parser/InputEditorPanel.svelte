<script>
  import Panel from "$lib/components/ui/Panel.svelte";
  import { estadoDelAnalizador, establecerEstadoDelAnalizador } from "$lib/stores/app-store";
  import { establecerErroresDelAnalizador } from "$lib/stores/error-store";
  import { tokenizarEntradaWison } from "$lib/services/lexer-basico";
  import { ejecutarParserGenerado } from "$lib/services/parser-api";
  import { get } from "svelte/store";

  let inputText = $state("12 + 8 * (7 - 4)");
  let lineaEntrada = $state();
  let feedbackAnalisis = $state("");
  let analizando = $state(false);

  function obtenerNumerosDeLinea(texto) {
    const totalLineas = Math.max(1, texto.split("\n").length);
    const numeros = [];

    for (let i = 1; i <= totalLineas; i += 1) {
      numeros.push(i);
    }

    return numeros;
  }

  function sincronizarNumerosDeLinea(event) {
    if (lineaEntrada) {
      lineaEntrada.scrollTop = event.currentTarget.scrollTop;
    }
  }

  // Ejecuta el parser con la entrada del usuario.
  function onAnalizarEntrada() {
    // Inicia modo de analisis.
    analizando = true;
    feedbackAnalisis = "";
    establecerErroresDelAnalizador([]);

    // Obtiene el estado actual del store de forma segura.
    const estadoActual = get(estadoDelAnalizador);

    // Verifica que exista un parser inyectado.
    if (!estadoActual || !estadoActual.parserGeneradoInstancia) {
      feedbackAnalisis = "Primero debes evaluar y generar un analizador.";
      analizando = false;
      return;
    }

    const terminalesDeclaradas = estadoActual?.ast?.lex?.terminals ?? [];
    if (!Array.isArray(terminalesDeclaradas) || terminalesDeclaradas.length === 0) {
      feedbackAnalisis = "El analizador activo no tiene terminales lexicas declaradas.";
      analizando = false;
      return;
    }

    // Tokeniza la entrada usando el lexer definido por la gramatica Wison.
    const resultadoLexer = tokenizarEntradaWison(inputText, terminalesDeclaradas);
    if (resultadoLexer.errores.length > 0) {
      establecerErroresDelAnalizador(resultadoLexer.errores);
      feedbackAnalisis = `Analisis detenido por ${resultadoLexer.errores.length} error(es) lexico(s).`;
      analizando = false;
      return;
    }

    const tokens = resultadoLexer.tokens;

    // Ejecuta el parser con los tokens.
    const resultado = ejecutarParserGenerado(estadoActual.parserGeneradoInstancia, tokens);

    // Guarda el resultado en el store para que otros paneles lo vean.
    establecerEstadoDelAnalizador({
      resultadoAnalisisEntrada: resultado
    });

    // Muestra resultado de analisis.
    if (resultado.ok && resultado.errores.length === 0) {
      feedbackAnalisis = "Analisis exitoso.";
    } else {
      feedbackAnalisis = `Analisis con ${resultado.errores.length} error(es).`;
      establecerErroresDelAnalizador(resultado.errores);
    }

    // Finaliza modo de analisis.
    analizando = false;
  }
</script>

<Panel
  title="Prueba de Cadena"
  subtitle="Ingresa la entrada para el analizador seleccionado"
>
  {#snippet actions()}
    <button type="button" onclick={onAnalizarEntrada} disabled={analizando}>
      {analizando ? "Analizando..." : "Analizar Entrada"}
    </button>
  {/snippet}

  {#if feedbackAnalisis}
    <p class="feedback">{feedbackAnalisis}</p>
  {/if}

  <label for="input-editor">Editor de entrada</label>
  <div class="editor-shell">
    <div class="line-numbers" bind:this={lineaEntrada} aria-hidden="true">
      {#each obtenerNumerosDeLinea(inputText) as numero}
        <span>{numero}</span>
      {/each}
    </div>
    <textarea
      id="input-editor"
      rows="10"
      bind:value={inputText}
      onscroll={sincronizarNumerosDeLinea}
      spellcheck="false"
    ></textarea>
  </div>
</Panel>

<style>
  .editor-shell {
    display: grid;
    grid-template-columns: 3.25rem minmax(0, 1fr);
    align-items: stretch;
    border: 1px solid rgba(25, 41, 74, 0.2);
    border-radius: 0.9rem;
    overflow: hidden;
    background: #101a33;
    min-height: 15.5rem;
  }

  .line-numbers {
    display: grid;
    align-content: start;
    padding: 0.8rem 0.45rem;
    background: rgba(255, 255, 255, 0.04);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(242, 246, 255, 0.48);
    font: 600 0.78rem/1.55 var(--font-mono);
    text-align: right;
    user-select: none;
    overflow: auto;
    scrollbar-width: none;
  }

  .line-numbers::-webkit-scrollbar {
    display: none;
  }

  .line-numbers span {
    display: block;
    padding-right: 0.2rem;
  }

  label {
    display: block;
    margin-bottom: 0.42rem;
    font: 600 0.78rem/1.2 var(--font-mono);
    letter-spacing: 0.02em;
    color: var(--color-ink);
  }

  textarea {
    width: 100%;
    height: 100%;
    min-height: 15.5rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #f2f6ff;
    font: 500 0.92rem/1.55 var(--font-mono);
    padding: 0.8rem 1rem;
    resize: vertical;
    outline: none;
  }

  button {
    border: 0;
    border-radius: 0.6rem;
    padding: 0.45rem 0.85rem;
    font: 700 0.73rem/1 var(--font-mono);
    letter-spacing: 0.02em;
    background: #2f9c76;
    color: #082116;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .feedback {
    margin: 0 0 0.7rem;
    font: 600 0.78rem/1.35 var(--font-text);
    color: var(--color-ink);
  }
</style>
