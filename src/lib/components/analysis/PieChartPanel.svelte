<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import type { CategoryBudgetRow } from '$lib/types';
	import type { PieSlice } from '$lib/utils/chartData';
	import { rowsToPieData } from '$lib/utils/chartData';
	import { formatEur } from '$lib/utils/budgetCalc';
	import { ui } from '$lib/stores/ui.svelte';
	import { ChevronRight } from 'lucide-svelte';
	import ChartContainer from './ChartContainer.svelte';

	let {
		title,
		rows,
		valueMode,
		color
	}: {
		title: string;
		rows: CategoryBudgetRow[];
		valueMode: 'planned' | 'actual';
		color: string;
	} = $props();

	// Drill-down state
	let drillPath = $state<{ uuid: string; name: string; rows: CategoryBudgetRow[] }[]>([]);

	let currentRows = $derived.by(() => {
		if (drillPath.length === 0) return rows;
		return drillPath[drillPath.length - 1].rows;
	});

	let pieData = $derived(rowsToPieData(currentRows, valueMode));

	let total = $derived(pieData.reduce((sum, s) => sum + s.value, 0));

	// Color palette
	const COLORS = [
		'#4f8cff', '#6da1ff', '#3b6fd9', '#22c55e', '#16a34a',
		'#f59e0b', '#eab308', '#ef4444', '#ec4899', '#8b5cf6',
		'#06b6d4', '#14b8a6', '#84cc16', '#f97316', '#6366f1'
	];

	let chartOption = $derived.by((): EChartsOption => {
		const data = pieData.map((s, i) => ({
			name: s.name,
			value: s.value,
			itemStyle: {
				color: s.uuid === '__sonstige__' ? '#71717a' : COLORS[i % COLORS.length]
			}
		}));

		return {
			tooltip: {
				trigger: 'item',
				formatter: (params: any) => {
					const pct = ((params.value / total) * 100).toFixed(1);
					return `<b>${params.name}</b><br/>${formatEur(params.value)} € (${pct}%)`;
				}
			},
			series: [
				{
					type: 'pie',
					radius: ['45%', '75%'],
					center: ['50%', '55%'],
					avoidLabelOverlap: true,
					itemStyle: {
						borderRadius: 4,
						borderColor: '#1a1a2e',
						borderWidth: 2
					},
					label: {
						show: true,
						color: '#a1a1aa',
						fontSize: 11,
						formatter: '{b}'
					},
					labelLine: {
						lineStyle: { color: '#2e3a5a' }
					},
					emphasis: {
						label: { show: true, fontSize: 13, fontWeight: 'bold' },
						itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' }
					},
					data,
					animationType: 'scale',
					animationEasing: 'cubicOut'
				}
			],
			graphic: [
				{
					type: 'text',
					left: 'center',
					top: '48%',
					style: {
						text: `${formatEur(total)} €`,
						fill: '#e4e4e7',
						fontSize: 16,
						fontWeight: 'bold',
						fontFamily: "'Inter', sans-serif"
					} as any
				}
			]
		};
	});

	function handleClick(params: any) {
		const sliceIndex = params.dataIndex;
		if (sliceIndex == null || sliceIndex >= pieData.length) return;
		const slice = pieData[sliceIndex];

		if (slice.uuid === '__sonstige__') return;

		if (slice.group && slice.children.length > 0) {
			// Drill down
			drillPath = [
				...drillPath,
				{ uuid: slice.uuid, name: slice.name, rows: slice.children }
			];
		} else {
			// Leaf: select category
			ui.selectCategory(slice.uuid);
		}
	}

	function navigateTo(index: number) {
		if (index < 0) {
			drillPath = [];
		} else {
			drillPath = drillPath.slice(0, index + 1);
		}
	}
</script>

<div class="flex-1 min-w-0">
	<!-- Title + breadcrumbs -->
	<div class="flex items-center gap-1 px-3 py-2 text-xs">
		<button
			onclick={() => navigateTo(-1)}
			class="text-text-muted hover:text-accent transition-colors {drillPath.length > 0
				? 'cursor-pointer'
				: 'cursor-default font-medium text-text'}"
		>
			{title}
		</button>
		{#each drillPath as crumb, i}
			<ChevronRight size={12} class="text-text-dim" />
			<button
				onclick={() => navigateTo(i)}
				class="text-text-muted hover:text-accent transition-colors {i === drillPath.length - 1
					? 'text-text font-medium'
					: ''}"
			>
				{crumb.name}
			</button>
		{/each}
	</div>

	<ChartContainer option={chartOption} height="280px" onclick={handleClick} />
</div>
