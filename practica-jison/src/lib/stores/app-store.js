import { writable } from 'svelte/store';

// Estado base de toda la app del analizador.
const ESTADO_INICIAL = {
	// Estado general de la validacion de configuracion.
	status: 'idle',
	// AST de la configuracion Wison evaluada.
	ast: null,
	// Mensaje corto para UI.
	message: '',
	// Conjuntos PRIMERO y SIGUIENTE calculados.
	conjuntosPrimeroSiguiente: null,
	// Tabla LL(1) lista para consulta/generacion.
	tablaLl1: null,
	// Lista de conflictos de tabla LL(1).
	conflictosLl1: null,
	// Codigo fuente del parser descendente generado.
	parserGeneradoFuente: '',
	// Codigo JavaScript del analizador objetivo compilado por Jison.
	parserObjetivoFuente: '',
	// Instancia activa del parser inyectado en caliente.
	parserGeneradoInstancia: null,
	// Resultado de analizar una cadena de entrada.
	resultadoAnalisisEntrada: null,
	// Lista de analizadores guardados en API.
	analizadoresDisponibles: [],
	// ID del analizador seleccionado desde la lista.
	analizadorSeleccionadoId: null,
	// Nombre del analizador seleccionado.
	analizadorSeleccionadoNombre: '',
	// Fuente Wison cargada desde API para editor.
	wisonFuenteSeleccionada: ''
};

export const estadoDelAnalizador = writable(ESTADO_INICIAL);

export function establecerEstadoDelAnalizador(nuevoEstado) {
	// Actualiza solo los campos enviados sin perder el estado actual.
	estadoDelAnalizador.update((estadoActual) => ({
		...estadoActual,
		...nuevoEstado
	}));
}

export function restablecerEstadoDelAnalizador() {
	// Regresa todos los campos al estado inicial.
	estadoDelAnalizador.set(ESTADO_INICIAL);
}
