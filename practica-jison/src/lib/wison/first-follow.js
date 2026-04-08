const EPSILON = 'ε';
const EOF = '$';

// Calcula los conjuntos de primeros y siguientes de una gramática.
class CalculadoraPrimeroSiguiente {
	constructor(ast) {
		this.ast = ast;
		this.noTerminales = ast?.syntax?.noTerminales ?? ast?.syntax?.nonTerminals ?? [];
		this.primeros = new Map();
		this.siguientes = new Map();
	}

	inicializarConjuntos() {
		// Crea un conjunto vacío para cada no terminal.
		for (let i = 0; i < this.noTerminales.length; i += 1) {
			const noTerminal = this.noTerminales[i];
			// Cada símbolo recibe su propio PRIMERO y FOLLOW.
			this.primeros.set(noTerminal, new Set());
			this.siguientes.set(noTerminal, new Set());
		}
	}

	agregarTodos(elementosDestino, elementosOrigen) {
		// Agrega valores nuevos al conjunto destino.
		let huboCambios = false;
		for (const value of elementosOrigen) {
			// Solo suma lo que todavía no existe.
			if (!elementosDestino.has(value)) {
				elementosDestino.add(value);
				huboCambios = true;
			}
		}
		return huboCambios;
	}

	obtenerPrimerosDeSecuencia(secuencia) {
		// Calcula PRIMERO para una secuencia de símbolos.
		const conjuntoResultado = new Set();

		if (!secuencia || secuencia.length === 0) {
			// Una secuencia vacía produce epsilon.
			conjuntoResultado.add(EPSILON);
			return conjuntoResultado;
		}

		let todaAnulable = true;
		for (let i = 0; i < secuencia.length; i += 1) {
			const simbolo = secuencia[i];

			if (simbolo && simbolo.kind === 'idTerminal') {
				// Un terminal corta el cálculo en ese punto.
				conjuntoResultado.add(simbolo.value);
				todaAnulable = false;
				break;
			}

			if (simbolo && simbolo.kind === 'idNonTerminal') {
				// Se copian los primeros del no terminal actual.
				const primerosDelSimbolo = this.primeros.get(simbolo.value) ?? new Set();
				for (const token of primerosDelSimbolo) {
					// Epsilon no se agrega, ya que se maneja aparte.
					if (token !== EPSILON) {
						conjuntoResultado.add(token);
					}
				}
				// Si no puede vaciarse, ya no hace falta seguir.
				if (!primerosDelSimbolo.has(EPSILON)) {
					todaAnulable = false;
					break;
				}
				// Si puede vaciarse, se revisa el siguiente símbolo.
				continue;
			}

			// Cualquier otro caso corta la secuencia.
			todaAnulable = false;
			break;
		}

		if (todaAnulable) {
			// Si todo puede desaparecer, se agrega epsilon.
			conjuntoResultado.add(EPSILON);
		}

		return conjuntoResultado;
	}

	calcularPrimeros() {
		// Repite hasta que PRIMERO ya no cambie.
		const productions = this.ast?.syntax?.productions ?? [];
		let huboCambios = true;

		while (huboCambios) {
			huboCambios = false;
			for (let i = 0; i < productions.length; i += 1) {
				const produccion = productions[i];
				const ladoIzquierdo = produccion?.lhs;
				// Si el lado izquierdo no existe, se salta la regla.
				if (!ladoIzquierdo || !this.primeros.has(ladoIzquierdo)) {
					continue;
				}

				const opcionesDerechas = produccion?.rhs ?? [];
				for (let j = 0; j < opcionesDerechas.length; j += 1) {
					const secuencia = opcionesDerechas[j];
					// Calcula PRIMERO para cada alternativa de la producción.
					const primerosDeSecuencia = this.obtenerPrimerosDeSecuencia(secuencia);
					if (this.agregarTodos(this.primeros.get(ladoIzquierdo), primerosDeSecuencia)) {
						// Si entra algo nuevo, hay que repetir.
						huboCambios = true;
					}
				}
			}
		}
	}

	calcularSiguientes() {
		// Repite hasta que FOLLOW ya no cambie.
		const simboloInicial = this.ast?.syntax?.startSymbol;
		if (simboloInicial && this.siguientes.has(simboloInicial)) {
			this.siguientes.get(simboloInicial).add(EOF);
		}

		const productions = this.ast?.syntax?.productions ?? [];
		let huboCambios = true;

		while (huboCambios) {
			huboCambios = false;
			for (let i = 0; i < productions.length; i += 1) {
				const produccion = productions[i];
				const ladoIzquierdo = produccion?.lhs;
				// También se valida que el lado izquierdo tenga FOLLOW.
				if (!ladoIzquierdo || !this.siguientes.has(ladoIzquierdo)) {
					continue;
				}

				const opcionesDerechas = produccion?.rhs ?? [];
				for (let j = 0; j < opcionesDerechas.length; j += 1) {
					const secuencia = opcionesDerechas[j] ?? [];
					// Recorre la producción símbolo por símbolo.
					for (let k = 0; k < secuencia.length; k += 1) {
						const simbolo = secuencia[k];
						// Solo interesa cuando el símbolo actual es no terminal.
						if (!simbolo || simbolo.kind !== 'idNonTerminal') {
							continue;
						}

						// Toma lo que viene después del símbolo actual.
						const resto = secuencia.slice(k + 1);
						const primerosDelResto = this.obtenerPrimerosDeSecuencia(resto);
						const siguientesDelSimbolo = this.siguientes.get(simbolo.value);
						// Si no existe el conjunto, no hay nada que actualizar.
						if (!siguientesDelSimbolo) {
							continue;
						}

						const primerosDelRestoSinEpsilon = new Set();
						for (const token of primerosDelResto) {
							// Se separa epsilon para no mezclarlo con terminales reales.
							if (token !== EPSILON) {
								primerosDelRestoSinEpsilon.add(token);
							}
						}

						// Lo primero del resto va al FOLLOW del símbolo actual.
						if (this.agregarTodos(siguientesDelSimbolo, primerosDelRestoSinEpsilon)) {
							huboCambios = true;
						}

						// Si el resto puede vaciarse, se copia el FOLLOW del lado izquierdo.
						if (resto.length === 0 || primerosDelResto.has(EPSILON)) {
							const siguientesDelLadoIzquierdo = this.siguientes.get(ladoIzquierdo);
							if (siguientesDelLadoIzquierdo && this.agregarTodos(siguientesDelSimbolo, siguientesDelLadoIzquierdo)) {
								huboCambios = true;
							}
						}
					}
				}
			}
		}
	}

	objetoOrdenado(mapa) {
		// Convierte un Map<Set> en un objeto simple ordenado.
		const objetoSalida = {};
		for (const [key, set] of mapa.entries()) {
			// Se pasa el conjunto a un arreglo para poder ordenarlo.
			const valores = [];
			for (const value of set) {
				valores.push(value);
			}
			// Orden alfabético para que la salida sea estable.
			valores.sort();
			objetoSalida[key] = valores;
		}
		return objetoSalida;
	}

	calcular() {
		// Ejecuta todo el proceso y regresa el resultado final.
		this.inicializarConjuntos();
		this.calcularPrimeros();
		this.calcularSiguientes();

		return {
			epsilon: EPSILON,
			eof: EOF,
			primeros: this.objetoOrdenado(this.primeros),
			siguientes: this.objetoOrdenado(this.siguientes)
		};
	}
}

// Función pública para obtener PRIMERO y SIGUIENTE.
export function calcularPrimeroSiguiente(ast) {
	const calculator = new CalculadoraPrimeroSiguiente(ast);
	return calculator.calcular();
}

export { CalculadoraPrimeroSiguiente };

export default calcularPrimeroSiguiente;
