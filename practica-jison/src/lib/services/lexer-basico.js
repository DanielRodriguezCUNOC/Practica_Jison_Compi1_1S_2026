// Tokenizador muy basico que divide por espacios y reconoce operadores simples.
export function tokenizadorBasico(textoEntrada) {
	// Resultado base de tokenizacion.
	const tokens = [];
	
	if (typeof textoEntrada !== 'string' || textoEntrada.trim().length === 0) {
		// Si la entrada esta vacia, retorna solo EOF.
		tokens.push({
tipo: 'EOF',
valor: 'EOF',
fila: 1,
columna: 1
});
		return tokens;
	}

	// Divide el texto por espacios en blanco.
	const palabras = textoEntrada.trim().split(/\s+/);
	let columnaActual = 1;

	for (let i = 0; i < palabras.length; i += 1) {
		const palabra = palabras[i];
		
		// Token encontrado como palabra.
		const token = {
			tipo: palabra,
			valor: palabra,
			fila: 1,
			columna: columnaActual
		};
		
		tokens.push(token);
		// Suma el largo de la palabra + espacio para proxima columna.
		columnaActual += palabra.length + 1;
	}

	// Siempre agrega EOF al final.
	tokens.push({
tipo: 'EOF',
valor: 'EOF',
fila: 1,
columna: columnaActual
});

	return tokens;
}
