const MAX_NODOS = 300;
const ANCHO_MIN_NODO = 94;
const ANCHO_MAX_NODO = 210;
const ALTO_NODO = 34;
const ESPACIADO_X = 32;
const ESPACIADO_Y = 74;
const MARGEN = 28;

const ETIQUETAS_CLAVE = {
	lhs: 'No terminal',
	rhs: 'Producciones',
	lex: 'Lexer',
	syntax: 'Parser',
	terminals: 'Terminales',
	nonTerminals: 'No terminales',
	productions: 'Producciones',
	startSymbol: 'Simbolo inicial',
	expr: 'Expresion',
	value: 'Valor',
	id: 'Identificador',
	kind: 'Tipo',
	type: 'Categoria',
	operator: 'Operador',
	errors: 'Errores',
	lexical: 'Lexicos',
	syntactic: 'Sintacticos',
	line: 'Linea',
	column: 'Columna'
};

function capitalizar(texto) {
	if (!texto) return '';
	return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function claveAmigable(clave) {
	if (!clave) return '';
	if (ETIQUETAS_CLAVE[clave]) return ETIQUETAS_CLAVE[clave];

	const sinIndice = String(clave).replace(/\[(\d+)\]/g, ' $1');
	const conEspacios = sinIndice
		.replace(/_/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\s+/g, ' ')
		.trim();

	return capitalizar(conEspacios || String(clave));
}

function esValorPrimitivo(valor) {
	return valor == null || typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean';
}

function truncarEtiqueta(valor) {
	const texto = String(valor ?? 'null');
	if (texto.length <= 34) return texto;
	return `${texto.slice(0, 31)}...`;
}

function estimarAnchoNodo(etiqueta) {
	const aproximado = etiqueta.length * 7 + 26;
	if (aproximado < ANCHO_MIN_NODO) return ANCHO_MIN_NODO;
	if (aproximado > ANCHO_MAX_NODO) return ANCHO_MAX_NODO;
	return aproximado;
}

function construirEtiquetaPrincipal(objeto, clavePadre = null) {
	const clavesPreferidas = ['symbol', 'etiqueta', 'label', 'name', 'type', 'kind', 'id', 'token', 'value'];
	const etiquetaPadre = clavePadre ? claveAmigable(clavePadre) : null;

	for (let i = 0; i < clavesPreferidas.length; i += 1) {
		const clave = clavesPreferidas[i];
		if (typeof objeto?.[clave] === 'string' || typeof objeto?.[clave] === 'number') {
			return etiquetaPadre ? `${etiquetaPadre}: ${objeto[clave]}` : String(objeto[clave]);
		}
	}

	if (etiquetaPadre) return etiquetaPadre;
	return 'Nodo';
}

function construirNodoNormalizado(valor, clavePadre = null, visitados = new WeakSet()) {
	const etiquetaPadre = clavePadre ? claveAmigable(clavePadre) : null;

	if (esValorPrimitivo(valor)) {
		const etiqueta = truncarEtiqueta(etiquetaPadre ? `${etiquetaPadre}: ${String(valor)}` : String(valor));
		return {
			label: etiqueta,
			nodeWidth: estimarAnchoNodo(etiqueta),
			children: []
		};
	}

	if (Array.isArray(valor)) {
		const hijos = [];
		for (let i = 0; i < valor.length && i < MAX_NODOS; i += 1) {
			const claveElemento = etiquetaPadre ? `${etiquetaPadre} [${i}]` : `Elemento [${i}]`;
			hijos.push(construirNodoNormalizado(valor[i], claveElemento, visitados));
		}
		const etiquetaLista = truncarEtiqueta(etiquetaPadre ? `${etiquetaPadre}` : 'Lista');

		return {
			label: etiquetaLista,
			nodeWidth: estimarAnchoNodo(etiquetaLista),
			children: hijos
		};
	}

	if (typeof valor === 'object') {
		if (visitados.has(valor)) {
			const etiquetaCiclo = truncarEtiqueta(etiquetaPadre ? `${etiquetaPadre}: <ciclo>` : '<ciclo>');
			return {
				label: etiquetaCiclo,
				nodeWidth: estimarAnchoNodo(etiquetaCiclo),
				children: []
			};
		}
		visitados.add(valor);

		const etiqueta = construirEtiquetaPrincipal(valor, clavePadre);
		const etiquetaFinal = truncarEtiqueta(etiqueta);
		const hijos = [];
		const entradas = Object.entries(valor);

		for (let i = 0; i < entradas.length && hijos.length < MAX_NODOS; i += 1) {
			const [clave, hijoValor] = entradas[i];
			if (clave === 'label' || clave === 'name' || clave === 'type' || clave === 'kind' || clave === 'symbol') {
				continue;
			}
			hijos.push(construirNodoNormalizado(hijoValor, claveAmigable(clave), visitados));
		}

		return {
			label: etiquetaFinal,
			nodeWidth: estimarAnchoNodo(etiquetaFinal),
			children: hijos
		};
	}

	const etiquetaFallback = truncarEtiqueta(etiquetaPadre ?? 'Nodo');
	return {
		label: etiquetaFallback,
		nodeWidth: estimarAnchoNodo(etiquetaFallback),
		children: []
	};
}

function medirAnchoSubarbol(nodo) {
	const anchoPropio = nodo.nodeWidth ?? ANCHO_MIN_NODO;
	if (!Array.isArray(nodo.children) || nodo.children.length === 0) {
		nodo._anchoSubarbol = anchoPropio;
		nodo._anchoHijos = 0;
		return anchoPropio;
	}

	let acumulado = 0;
	for (let i = 0; i < nodo.children.length; i += 1) {
		acumulado += medirAnchoSubarbol(nodo.children[i]);
	}
	const separaciones = ESPACIADO_X * Math.max(0, nodo.children.length - 1);
	const anchoHijos = acumulado + separaciones;

	nodo._anchoHijos = anchoHijos;
	nodo._anchoSubarbol = Math.max(anchoPropio, anchoHijos);
	return nodo._anchoSubarbol;
}

function asignarPosiciones(nodo, profundidad, inicioX, salida) {
	const anchoSubarbol = nodo._anchoSubarbol ?? (nodo.nodeWidth ?? ANCHO_MIN_NODO);
	const nodoAncho = nodo.nodeWidth ?? ANCHO_MIN_NODO;
	const centroX = inicioX + anchoSubarbol / 2;

	const nodoSalida = {
		id: salida.nodes.length + 1,
		label: nodo.label,
		depth: profundidad,
		x: MARGEN + centroX,
		y: MARGEN + profundidad * ESPACIADO_Y,
		width: nodoAncho,
		height: ALTO_NODO
	};

	salida.nodes.push(nodoSalida);
	if (nodoSalida.x - nodoAncho / 2 < salida.minX) salida.minX = nodoSalida.x - nodoAncho / 2;
	if (nodoSalida.x + nodoAncho / 2 > salida.maxX) salida.maxX = nodoSalida.x + nodoAncho / 2;
	if (nodoSalida.y + ALTO_NODO / 2 > salida.maxY) salida.maxY = nodoSalida.y + ALTO_NODO / 2;

	const anchoHijos = nodo._anchoHijos ?? 0;
	let cursor = inicioX + Math.max(0, (anchoSubarbol - anchoHijos) / 2);
	for (let i = 0; i < (nodo.children?.length ?? 0); i += 1) {
		const hijo = nodo.children[i];
		const idPadre = nodoSalida.id;
		const idHijo = asignarPosiciones(hijo, profundidad + 1, cursor, salida);

		const nodoHijo = salida.nodes[idHijo - 1];
		salida.edges.push({
			fromX: nodoSalida.x,
			fromY: nodoSalida.y + ALTO_NODO / 2,
			toX: nodoHijo.x,
			toY: nodoHijo.y - ALTO_NODO / 2,
			parentId: idPadre,
			childId: idHijo
		});

		cursor += (hijo._anchoSubarbol ?? (hijo.nodeWidth ?? ANCHO_MIN_NODO)) + ESPACIADO_X;
	}

	return nodoSalida.id;
}

function obtenerFuenteArbol(estado) {
	const arbolAnalisis = estado?.resultadoAnalisisEntrada?.arbol ?? null;
	if (arbolAnalisis) {
		return {
			source: 'resultadoAnalisisEntrada.arbol',
			root: arbolAnalisis
		};
	}

	if (estado?.ast) {
		return {
			source: 'ast (configuracion)',
			root: estado.ast
		};
	}

	return null;
}

export function construirArbolSvgDesdeEstado(estado) {
	const fuente = obtenerFuenteArbol(estado);
	if (!fuente?.root) return null;

	const normalizado = construirNodoNormalizado(fuente.root);
	medirAnchoSubarbol(normalizado);

	const salida = {
		source: fuente.source,
		nodes: [],
		edges: [],
		minX: Infinity,
		maxX: 0,
		maxY: 0
	};

	asignarPosiciones(normalizado, 0, 0, salida);

	const desplazamiento = salida.minX < 0 ? Math.abs(salida.minX) + MARGEN : 0;
	if (desplazamiento > 0) {
		for (let i = 0; i < salida.nodes.length; i += 1) {
			salida.nodes[i].x += desplazamiento;
		}
		for (let i = 0; i < salida.edges.length; i += 1) {
			salida.edges[i].fromX += desplazamiento;
			salida.edges[i].toX += desplazamiento;
		}
		salida.maxX += desplazamiento;
	}

	return {
		source: salida.source,
		nodes: salida.nodes,
		edges: salida.edges,
		width: Math.ceil(salida.maxX + MARGEN),
		height: Math.ceil(salida.maxY + ALTO_NODO + MARGEN)
	};
}
