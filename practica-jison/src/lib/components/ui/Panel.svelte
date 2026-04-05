<script>
	let { title = '', subtitle = '', tone = 'neutral', children, actions } = $props();
</script>

<section class={`panel panel--${tone}`}>
	<header class="panel__header">
		<div>
			<h2>{title}</h2>
			{#if subtitle}
				<p>{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="panel__actions">
				{@render actions()}
			</div>
		{/if}
	</header>

	<div class="panel__body">
		{@render children()}
	</div>
</section>

<style>
	.panel {
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 255, 0.9));
		border: 1px solid rgba(25, 41, 74, 0.12);
		border-radius: 1rem;
		box-shadow: 0 14px 30px rgba(8, 16, 40, 0.1);
		overflow: hidden;
	}

	.panel__header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.2rem;
		border-bottom: 1px solid rgba(25, 41, 74, 0.1);
	}

	h2 {
		margin: 0;
		font: 600 1rem/1.3 var(--font-display);
		letter-spacing: 0.02em;
		color: var(--color-ink);
	}

	p {
		margin: 0.3rem 0 0;
		font: 500 0.84rem/1.35 var(--font-text);
		color: var(--color-ink-soft);
	}

	.panel__body {
		padding: 1rem 1.2rem 1.2rem;
	}

	.panel--accent {
		border-color: rgba(209, 83, 30, 0.25);
		box-shadow: 0 14px 30px rgba(209, 83, 30, 0.08);
	}

	.panel--alert {
		border-color: rgba(165, 36, 36, 0.3);
		box-shadow: 0 14px 30px rgba(165, 36, 36, 0.08);
	}
</style>