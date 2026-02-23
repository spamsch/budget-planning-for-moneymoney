/**
 * Modular ECharts imports + custom dark theme matching the app's CSS variables.
 */
import * as echarts from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import {
	TitleComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
	PieChart,
	BarChart,
	TitleComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent,
	CanvasRenderer
]);

// Custom dark theme matching app CSS variables
const appTheme: Record<string, any> = {
	backgroundColor: 'transparent',
	textStyle: {
		color: '#e4e4e7', // --color-text
		fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
	},
	title: {
		textStyle: { color: '#e4e4e7' },
		subtextStyle: { color: '#a1a1aa' }
	},
	tooltip: {
		backgroundColor: '#16213e', // --color-bg-secondary
		borderColor: '#2e3a5a', // --color-border
		textStyle: { color: '#e4e4e7' }
	},
	legend: {
		textStyle: { color: '#a1a1aa' } // --color-text-muted
	},
	categoryAxis: {
		axisLine: { lineStyle: { color: '#2e3a5a' } },
		axisTick: { lineStyle: { color: '#2e3a5a' } },
		axisLabel: { color: '#a1a1aa' },
		splitLine: { lineStyle: { color: '#2e3a5a', type: 'dashed' } }
	},
	valueAxis: {
		axisLine: { lineStyle: { color: '#2e3a5a' } },
		axisTick: { lineStyle: { color: '#2e3a5a' } },
		axisLabel: { color: '#a1a1aa' },
		splitLine: { lineStyle: { color: '#2e3a5a', type: 'dashed' } }
	}
};

echarts.registerTheme('budget-dark', appTheme);

export { echarts };
