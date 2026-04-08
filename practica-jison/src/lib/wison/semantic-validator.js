class ValidadorSemanticoWison {
	constructor() {
		this.errores = [];
	}

	agregarError(mensaje, extra = {}) {
		this.errores.push({
			tipo: 'semantico',
			mensaje,
			linea: null,
			columna: null,
			...extra
		});
	}

	contarIds(lista = []) {
		const mapa = new Map();
		for (let i = 0; i < lista.length; i += 1) {
			const valor = lista[i];
			if (mapa.has(valor)) {
				mapa.set(valor, mapa.get(valor) + 1);
			} else {
				mapa.set(valor, 1);
			}
		}
		return mapa;
	}

	obtenerTerminalesDeclarados(ast) {
		const terminals = ast?.lex?.terminals ?? [];
		const declared = [];

		for (let i = 0; i < terminals.length; i += 1) {
			const item = terminals[i];
			const id = item?.id;
			if (typeof id === 'string' && id.length > 0) {
				declared.push(id);
			}
		}

		return declared;
	}

	obtenerNoTerminalesDeclarados(ast) {
		const nonTerminals = ast?.syntax?.nonTerminals ?? [];
		const declared = [];

		for (let i = 0; i < nonTerminals.length; i += 1) {
			const id = nonTerminals[i];
			if (typeof id === 'string' && id.length > 0) {
				declared.push(id);
			}
		}

		return declared;
	}

	obtenerProducciones(ast) {
		return ast?.syntax?.productions ?? [];
	}

	validarSimboloInicial(ast, conjuntoNoTerminalesDeclarados) {
		const startSymbol = ast?.syntax?.startSymbol;
		if (!startSymbol) {
			this.agregarError('No se definio el simbolo inicial (Initial_Sim).');
			return;
		}

		if (!conjuntoNoTerminalesDeclarados.has(startSymbol)) {
			this.agregarError(`El simbolo inicial ${startSymbol} no fue declarado como No_Terminal.`);
		}
	}

	validarDuplicados(ids, etiqueta) {
		const contador = this.contarIds(ids);
		for (const [id, count] of contador.entries()) {
			if (count > 1) {
				this.agregarError(`${etiqueta} duplicado: ${id}.`);
			}
		}
	}

	validarProducciones(ast, conjuntoTerminalesDeclarados, conjuntoNoTerminalesDeclarados) {
		const producciones = this.obtenerProducciones(ast);
		const noTerminalesConProduccion = new Set();

		for (let i = 0; i < producciones.length; i += 1) {
			const produccion = producciones[i];
			const lhs = produccion?.lhs;

			if (typeof lhs !== 'string' || lhs.length === 0) {
				this.agregarError('Existe una produccion sin lado izquierdo valido.');
				continue;
			}

			noTerminalesConProduccion.add(lhs);

			if (!conjuntoNoTerminalesDeclarados.has(lhs)) {
				this.agregarError(`El no terminal ${lhs} se usa en el lado izquierdo pero no esta declarado.`);
			}

			const opciones = produccion?.rhs ?? [];
			for (let j = 0; j < opciones.length; j += 1) {
				const secuencia = opciones[j] ?? [];
				for (let k = 0; k < secuencia.length; k += 1) {
					const simbolo = secuencia[k];
					const kind = simbolo?.kind;
					const value = simbolo?.value;

					if (kind === 'idTerminal' && !conjuntoTerminalesDeclarados.has(value)) {
						this.agregarError(`El terminal ${value} se usa en producciones pero no esta declarado en Lex.`);
					}

					if (kind === 'idNonTerminal' && !conjuntoNoTerminalesDeclarados.has(value)) {
						this.agregarError(`El no terminal ${value} se usa en producciones pero no esta declarado.`);
					}
				}
			}
		}

		for (const nt of conjuntoNoTerminalesDeclarados) {
			if (!noTerminalesConProduccion.has(nt)) {
				this.agregarError(`El no terminal ${nt} no tiene producciones definidas.`);
			}
		}
	}

	validar(ast) {
		this.errores = [];

		if (!ast || typeof ast !== 'object') {
			this.agregarError('No se pudo validar semanticamente: AST invalido.');
			return {
				ok: false,
				errores: this.errores
			};
		}

		const terminalesDeclarados = this.obtenerTerminalesDeclarados(ast);
		const noTerminalesDeclarados = this.obtenerNoTerminalesDeclarados(ast);

		this.validarDuplicados(terminalesDeclarados, 'Terminal');
		this.validarDuplicados(noTerminalesDeclarados, 'No_Terminal');

		const conjuntoTerminalesDeclarados = new Set(terminalesDeclarados);
		const conjuntoNoTerminalesDeclarados = new Set(noTerminalesDeclarados);

		this.validarSimboloInicial(ast, conjuntoNoTerminalesDeclarados);
		this.validarProducciones(ast, conjuntoTerminalesDeclarados, conjuntoNoTerminalesDeclarados);

		return {
			ok: this.errores.length === 0,
			errores: this.errores
		};
	}
}

export function validarSemanticaWison(ast) {
	const validador = new ValidadorSemanticoWison();
	return validador.validar(ast);
}

export { ValidadorSemanticoWison };

export default validarSemanticaWison;
