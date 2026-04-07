import { writable } from 'svelte/store';

const INITIAL_STATE = {
	status: 'idle',
	ast: null,
	message: ''
};

export const parserState = writable(INITIAL_STATE);

export function setParserState(nextState) {
	parserState.set({
		...INITIAL_STATE,
		...nextState
	});
}

export function resetParserState() {
	parserState.set(INITIAL_STATE);
}
