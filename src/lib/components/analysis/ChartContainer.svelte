<script lang="ts">
	import { onMount } from 'svelte';
	import { echarts } from '$lib/charts/echarts-setup';
	import type { EChartsOption } from 'echarts';

	let {
		option,
		height = '300px',
		onclick
	}: {
		option: EChartsOption;
		height?: string;
		onclick?: (params: any) => void;
	} = $props();

	let container: HTMLDivElement;
	let chart: ReturnType<typeof echarts.init> | null = null;

	onMount(() => {
		chart = echarts.init(container, 'budget-dark');

		if (onclick) {
			chart.on('click', onclick);
		}

		const ro = new ResizeObserver(() => {
			chart?.resize();
		});
		ro.observe(container);

		return () => {
			ro.disconnect();
			chart?.dispose();
			chart = null;
		};
	});

	// Update option reactively
	$effect(() => {
		if (chart && option) {
			chart.setOption(option, { notMerge: true });
		}
	});
</script>

<div bind:this={container} style="width: 100%; height: {height};"></div>
