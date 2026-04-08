import { writable } from 'svelte/store';

export const erroresDelAnalizador = writable([]);

export function establecerErroresDelAnalizador(errores = []) {
	erroresDelAnalizador.set(errores);
}

export function limpiarErroresDelAnalizador() {
	erroresDelAnalizador.set([]);
}
