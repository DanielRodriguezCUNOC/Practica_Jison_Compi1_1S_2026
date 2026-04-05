<script>
	import favicon from "$lib/assets/favicon.svg";
	import "../app.scss";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Practica Jison - Constructor LL</title>
	<meta
		name="description"
		content="Interfaz visual para crear, validar y probar analizadores sintacticos LL en SvelteKit"
	/>
</svelte:head>

{@render children()}
