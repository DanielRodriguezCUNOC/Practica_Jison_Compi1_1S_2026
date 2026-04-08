
/*
 * Constructor de tabla LL1.
 *
 * Este archivo toma una gramática ya leída, calcula en qué celda va cada
 * producción y detecta conflictos cuando dos reglas quieren ocupar el mismo espacio.
 */
class ConstructorTablaLl1 {
  constructor(arbolSintactico, conjuntosPrimeroSiguiente) {
    this.arbolSintactico = arbolSintactico;
    this.conjuntosPrimeroSiguiente = conjuntosPrimeroSiguiente;
    this.tabla = {};
    this.conflictos = [];
    this.epsilon = null;
    this.eof = null;
    this.mapaPrimeros = null;
    this.mapaSiguientes = null;
  }

  inicializar() {
    // Valida que existan los datos necesarios.
    if (!this.arbolSintactico || !this.conjuntosPrimeroSiguiente) {
      return false;
    }

    // Extrae epsilon, fin de archivo y mapas de PRIMERO y SIGUIENTE.
    this.epsilon = this.conjuntosPrimeroSiguiente.epsilon;
    this.eof = this.conjuntosPrimeroSiguiente.eof;
    this.mapaPrimeros = this.conjuntosPrimeroSiguiente.primeros ?? {};
    this.mapaSiguientes = this.conjuntosPrimeroSiguiente.siguientes ?? {};
    return true;
  }

  obtenerProducciones() {
    const produccionesPlanas = [];
    const producciones = this.arbolSintactico?.syntax?.productions;

    // Sale si no hay producciones válidas.
    if (!producciones || !Array.isArray(producciones)) {
      return produccionesPlanas;
    }

    // Recorre cada regla de producción.
    for (let i = 0; i < producciones.length; i += 1) {
      const produccion = producciones[i];
      const lhs = produccion?.lhs;

      // Salta si no hay lado izquierdo.
      if (!lhs) {
        continue;
      }

      const opciones = produccion?.rhs;
      // Salta si no hay alternativas.
      if (!opciones || !Array.isArray(opciones)) {
        continue;
      }

      // Expande cada alternativa como una regla separada.
      for (let j = 0; j < opciones.length; j += 1) {
        const regla = opciones[j];
        const textoDerecho = this.formatearSecuencia(regla);

        produccionesPlanas.push({
          lhs,
          rhs: regla || [],
          representacion: `${lhs} → ${textoDerecho}`
        });
      }
    }

    return produccionesPlanas;
  }

  formatearSecuencia(secuencia) {
    // Una secuencia vacía se representa con epsilon.
    if (!secuencia || secuencia.length === 0) {
      return 'ε';
    }

    // Extrae el valor de cada símbolo.
    const partes = [];
    for (let i = 0; i < secuencia.length; i += 1) {
      const simbolo = secuencia[i];
      // Si el símbolo es nulo, se usa epsilon.
      if (!simbolo) {
        partes.push('ε');
        continue;
      }

      // Accede al valor, sea objeto o primitivo.
      if (typeof simbolo === 'object' && simbolo.value) {
        partes.push(simbolo.value);
      } else {
        partes.push(String(simbolo));
      }
    }

    // Si quedó vacío, retorna epsilon.
    if (partes.length === 0) {
      return 'ε';
    }

    // Une los símbolos con espacios.
    let resultado = '';
    for (let i = 0; i < partes.length; i += 1) {
      if (i > 0) {
        resultado += ' ';
      }
      resultado += partes[i];
    }

    return resultado;
  }

  agregarConflicto(noTerminal, terminal, produccionExistente, produccionNueva) {
    this.conflictos.push({
      nonterminal: noTerminal,
      terminal,
      productions: [produccionExistente, produccionNueva],
      type: 'reduce-reduce'
    });
  }

  calcularPrimerosDeSecuencia(secuencia) {
    const resultado = new Set();

    // Una secuencia vacía genera epsilon.
    if (!secuencia || secuencia.length === 0) {
      resultado.add(this.epsilon);
      return resultado;
    }

    // Comienza asumiendo que puede ser anulable.
    let todaNullable = true;
    for (let i = 0; i < secuencia.length; i += 1) {
      const simbolo = secuencia[i];
      // Un símbolo nulo corta el cálculo.
      if (!simbolo) {
        todaNullable = false;
        break;
      }

      // Extrae el valor del símbolo.
      let valorSimbolo = null;
      if (typeof simbolo === 'object' && simbolo.value) {
        valorSimbolo = simbolo.value;
      } else {
        valorSimbolo = String(simbolo);
      }

      // Busca los primeros del símbolo actual en el mapa.
      const primerosDelSimbolo = this.mapaPrimeros[valorSimbolo] || [];
      for (let j = 0; j < primerosDelSimbolo.length; j += 1) {
        const token = primerosDelSimbolo[j];
        // Se agregan solo los no-epsilon.
        if (token !== this.epsilon) {
          resultado.add(token);
        }
      }

      // Si el símbolo no es anulable, se detiene aquí.
      if (primerosDelSimbolo.indexOf(this.epsilon) === -1) {
        todaNullable = false;
        break;
      }
    }

    // Si toda la secuencia es anulable, se agrega epsilon.
    if (todaNullable) {
      resultado.add(this.epsilon);
    }

    return resultado;
  }

  agregarPrimeroAlaTabla(noTerminal, simboloTerminal, representacionProduccion) {
    // Crea una fila en la tabla si no existe.
    if (!this.tabla[noTerminal]) {
      this.tabla[noTerminal] = {};
    }

    // Si ya hay algo en esa celda, hay conflicto.
    if (this.tabla[noTerminal][simboloTerminal]) {
      this.agregarConflicto(
        noTerminal,
        simboloTerminal,
        this.tabla[noTerminal][simboloTerminal],
        representacionProduccion
      );
    } else {
      // Si está vacía, se agrega la producción.
      this.tabla[noTerminal][simboloTerminal] = representacionProduccion;
    }
  }

  agregarFollowAlaTabla(noTerminal, representacionProduccion) {
    // Obtiene los símbolos SIGUIENTE del no terminal.
    const simbolosFollow = this.mapaSiguientes[noTerminal] || [];
    // Por cada símbolo SIGUIENTE, se intenta agregar la producción.
    for (let i = 0; i < simbolosFollow.length; i += 1) {
      const terminal = simbolosFollow[i];
      this.agregarPrimeroAlaTabla(noTerminal, terminal, representacionProduccion);
    }
  }

  construir() {
    // Prepara los datos necesarios.
    if (!this.inicializar()) {
      return { tabla: {}, conflictos: [] };
    }

    // Obtiene todas las producciones expandidas.
    const produccionesPlanas = this.obtenerProducciones();
    // Por cada producción, agrega sus entradas a la tabla.
    for (let i = 0; i < produccionesPlanas.length; i += 1) {
      const produccion = produccionesPlanas[i];
      const noTerminal = produccion.lhs;
      const secuencia = produccion.rhs;
      const representacion = produccion.representacion;

      // Calcula PRIMERO del lado derecho.
      const primerosDeSecuencia = this.calcularPrimerosDeSecuencia(secuencia);
      // Agrega la producción para cada terminal en PRIMERO (excepto epsilon).
      for (const terminal of primerosDeSecuencia) {
        if (terminal !== this.epsilon) {
          this.agregarPrimeroAlaTabla(noTerminal, terminal, representacion);
        }
      }

      // Si el lado derecho es anulable, también agrega usando SIGUIENTE.
      if (primerosDeSecuencia.has(this.epsilon)) {
        this.agregarFollowAlaTabla(noTerminal, representacion);
      }
    }

    // Retorna la tabla y cualquier conflicto encontrado.
    return {
      tabla: this.tabla,
      conflictos: this.conflictos
    };
  }
}

/**
 * Construye la tabla LL1 usando el AST y los conjuntos PRIMERO/SIGUIENTE.
 */
export function construirTablaLl1(gramaticaNormalizada, conjuntosPrimeroSiguiente) {
  const constructor = new ConstructorTablaLl1(gramaticaNormalizada, conjuntosPrimeroSiguiente);
  return constructor.construir();
}

/**
 * Convierte la tabla a un formato plano para JSON.
 */
export function formatearTablaParseo(tabla) {
  const tablaFormateada = {};
  // Obtiene todos los no terminales de la tabla.
  const nombresNoTerminales = Object.keys(tabla || {});

  // Recorre cada no terminal.
  for (let i = 0; i < nombresNoTerminales.length; i += 1) {
    const noTerminal = nombresNoTerminales[i];
    const entradas = tabla[noTerminal] || {};
    // Inicializa una fila vacía para este no terminal.
    tablaFormateada[noTerminal] = {};

    // Copia cada entrada terminal.
    const terminales = Object.keys(entradas);
    for (let j = 0; j < terminales.length; j += 1) {
      const terminal = terminales[j];
      tablaFormateada[noTerminal][terminal] = entradas[terminal];
    }
  }

  return tablaFormateada;
}

/**
 * Da formato legible a los conflictos LL1.
 */
export function formatearConflictos(conflictos) {
  const conflictosFormateados = [];
  // Obtiene la lista segura de conflictos.
  const listaConflictos = conflictos || [];

  // Transforma cada conflicto a un formato legible.
  for (let i = 0; i < listaConflictos.length; i += 1) {
    const conflicto = listaConflictos[i];
    // Construye un objeto con todos los detalles del conflicto.
    conflictosFormateados.push({
      mensaje: `Conflicto LL(1) en [${conflicto.nonterminal}, ${conflicto.terminal}]`,
      noTerminal: conflicto.nonterminal,
      terminal: conflicto.terminal,
      producciones: conflicto.productions,
      tipo: conflicto.type
    });
  }

  return conflictosFormateados;
}

export { ConstructorTablaLl1 };
