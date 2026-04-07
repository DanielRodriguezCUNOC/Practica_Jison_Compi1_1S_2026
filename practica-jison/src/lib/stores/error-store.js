import { writable } from 'svelte/store';

export const parserErrors = writable([]);

export function setParserErrors(errors = []) {
	parserErrors.set(errors);
}

export function clearParserErrors() {
	parserErrors.set([]);
}
