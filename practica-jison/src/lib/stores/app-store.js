import { writable } from 'svelte/store';

const ESTADO_INICIAL = {
	status: 'idle',
	ast: null,
	message: ''
};

export const estadoDelAnalizador = writable(ESTADO_INICIAL);

export function establecerEstadoDelAnalizador(nuevoEstado) {
	estadoDelAnalizador.set({
		...ESTADO_INICIAL,
		...nuevoEstado
	});
}

export function restablecerEstadoDelAnalizador() {
	estadoDelAnalizador.set(ESTADO_INICIAL);
}
