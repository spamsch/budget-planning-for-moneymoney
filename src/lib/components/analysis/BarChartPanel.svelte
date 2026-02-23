<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import type { BarItem } from '$lib/utils/chartData';
	import { formatEur } from '$lib/utils/budgetCalc';
	import { ui } from '$lib/stores/ui.svelte';
	import ChartContainer from './ChartContainer.svelte';

	let {
		items
	}: {
		items: BarItem[];
	} = $props();

	let chartOption = $derived.by((): EChartsOption => {
		const categories = items.map((d) => d.name);
		const planned = items.map((d) => d.planned);
		const actual = items.map((d) => ({
			value: d.actual,
			itemStyle: {
				color: d.isOverBudget ? '#ef4444' : '#22c55e',
				...(d.isOverBudget
					? { shadowColor: 'rgba(239, 68, 68, 0.4)', shadowBlur: 8 }
					: {})
			}
		}));

		return {
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				formatter: (params: any) => {
					const cat = params[0]?.axisValue ?? '';
					const item = items.find((d) => d.name === cat);
					if (!item) return cat;
					const diff = item.difference;
					const diffColor = diff >= 0 ? '#22c55e' : '#ef4444';
					return `<b>${cat}</b><br/>
						Geplant: ${formatEur(item.planned)} €<br/>
						Tatsächlich: ${formatEur(item.actual)} €<br/>
						<span style="color: ${diffColor}">Differenz: ${diff >= 0 ? '+' : ''}${formatEur(diff)} €</span>`;
				}
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: '24px',
				containLabel: true
			},
			xAxis: {
				type: 'value',
				axisLabel: {
					formatter: (val: number) => formatEur(val)
				}
			},
			yAxis: {
				type: 'category',
				data: categories,
				inverse: true,
				axisLabel: {
					width: 120,
					overflow: 'truncate',
					fontSize: 11
				}
			},
			series: [
				{
					name: 'Geplant',
					type: 'bar',
					data: planned,
					barGap: '10%',
					itemStyle: { color: '#4f8cff', borderRadius: [0, 3, 3, 0] },
					barMaxWidth: 16
				},
				{
					name: 'Tatsächlich',
					type: 'bar',
					data: actual,
					itemStyle: { borderRadius: [0, 3, 3, 0] },
					barMaxWidth: 16
				}
			],
			animationDuration: 600,
			animationEasing: 'cubicOut'
		};
	});

	// Dynamic height based on number of items
	let chartHeight = $derived(Math.max(200, items.length * 40 + 60) + 'px');

	function handleClick(params: any) {
		const name = params.name;
		const item = items.find((d) => d.name === name);
		if (item) {
			ui.selectCategory(item.uuid);
		}
	}
</script>

<div class="px-4 py-2">
	<div class="text-xs font-medium text-text-muted mb-2">Geplant vs. Tatsächlich</div>
	<div class="rounded-lg bg-bg-secondary border border-border p-3">
		<ChartContainer option={chartOption} height={chartHeight} onclick={handleClick} />
	</div>
</div>
