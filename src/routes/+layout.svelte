<script>
	import '../app.css';
	let { children } = $props();
</script>

<div class="h-full flex flex-col">
	{@render children()}
</div>
