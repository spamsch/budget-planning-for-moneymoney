<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Send, Trash2, Settings, Eye, EyeOff, Loader2 } from 'lucide-svelte';
	import { marked } from 'marked';
	import { llm } from '$lib/stores/llm.svelte';
	import type { CategoryBudgetRow, MonthSummary } from '$lib/types';
	import { buildBudgetContext } from '$lib/utils/llmContext';

	marked.setOptions({ breaks: true, gfm: true });

	let {
		incomeRows,
		expenseRows,
		summary,
		month,
		scenarioName = null
	}: {
		incomeRows: CategoryBudgetRow[];
		expenseRows: CategoryBudgetRow[];
		summary: MonthSummary;
		month: string;
		scenarioName?: string | null;
	} = $props();

	let inputText = $state('');
	let messagesEnd: HTMLDivElement | undefined = $state();
	let showSettings = $state(false);
	let showApiKey = $state(false);

	const MODELS = [
		'gpt-4.1-nano',
		'gpt-4.1-mini',
		'gpt-4.1',
		'gpt-4o-mini',
		'gpt-4o',
		'o3-mini',
		'o3',
		'o4-mini',
		'gpt-5-nano',
		'gpt-5-mini',
		'gpt-5',
		'gpt-5.1',
		'gpt-5.2',
		'gpt-5.3-codex',
	];

	onMount(() => {
		if (!llm.configLoaded) {
			llm.loadConfig();
		}
	});

	async function scrollToBottom() {
		await tick();
		messagesEnd?.scrollIntoView({ behavior: 'smooth' });
	}

	$effect(() => {
		// Scroll whenever messages change
		if (llm.messages.length > 0) {
			scrollToBottom();
		}
	});

	async function handleSend() {
		const text = inputText.trim();
		if (!text || llm.loading || !llm.apiKey) return;

		inputText = '';
		const context = buildBudgetContext(incomeRows, expenseRows, summary, month, scenarioName);
		await llm.sendMessage(text, context);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	async function handleModelChange(e: Event) {
		llm.model = (e.target as HTMLSelectElement).value;
		await llm.saveConfig();
	}

	async function handleApiKeyBlur() {
		await llm.saveConfig();
	}
</script>

<div class="flex flex-col h-full">
	<!-- Header -->
	<div class="flex items-center justify-between px-3 py-2 border-b border-border">
		<span class="text-xs font-semibold">Chat</span>
		<div class="flex items-center gap-1">
			{#if llm.messages.length > 0}
				<button
					onclick={() => llm.clearChat()}
					class="p-1 rounded text-text-dim hover:text-negative hover:bg-negative/10 transition-colors"
					title="Chat leeren"
				>
					<Trash2 size={13} />
				</button>
			{/if}
			<button
				onclick={() => (showSettings = !showSettings)}
				class="p-1 rounded transition-colors {showSettings
					? 'text-accent bg-accent/10'
					: 'text-text-dim hover:text-text hover:bg-bg-tertiary'}"
				title="Einstellungen"
			>
				<Settings size={13} />
			</button>
		</div>
	</div>

	<!-- Settings -->
	{#if showSettings}
		<div class="px-3 py-2.5 border-b border-border flex flex-col gap-2 bg-bg-tertiary/30">
			<div>
				<label class="text-[10px] text-text-dim mb-0.5 block">API Key</label>
				<div class="flex items-center gap-1">
					<input
						type={showApiKey ? 'text' : 'password'}
						bind:value={llm.apiKey}
						onblur={handleApiKeyBlur}
						placeholder="sk-..."
						class="flex-1 bg-bg-input border border-border rounded px-2 py-1 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-accent font-mono"
					/>
					<button
						onclick={() => (showApiKey = !showApiKey)}
						class="p-1 rounded text-text-dim hover:text-text transition-colors"
					>
						{#if showApiKey}
							<EyeOff size={13} />
						{:else}
							<Eye size={13} />
						{/if}
					</button>
				</div>
			</div>
			<div>
				<label class="text-[10px] text-text-dim mb-0.5 block">Modell</label>
				<select
					value={llm.model}
					onchange={handleModelChange}
					class="w-full bg-bg-input border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-accent"
				>
					{#each MODELS as m}
						<option value={m}>{m}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	<!-- Messages -->
	<div class="flex-1 overflow-auto px-3 py-2 flex flex-col gap-2">
		{#if !llm.apiKey && llm.configLoaded}
			<div class="flex-1 flex flex-col items-center justify-center gap-2 text-text-dim">
				<Settings size={20} />
				<span class="text-xs text-center">API-Key erforderlich.<br />Klicke auf das Zahnrad oben.</span>
			</div>
		{:else if llm.messages.length === 0}
			<div class="flex-1 flex flex-col items-center justify-center gap-2 text-text-dim">
				<span class="text-xs text-center">Stelle Fragen zu deinem Budget.</span>
			</div>
		{:else}
			{#each llm.messages as msg}
				{#if msg.role === 'user'}
					<div class="text-xs leading-relaxed bg-accent/10 text-text rounded-lg px-2.5 py-1.5 self-end max-w-[85%]">
						<div class="whitespace-pre-wrap break-words">{msg.content}</div>
					</div>
				{:else}
					<div class="text-xs leading-relaxed bg-bg-tertiary/50 text-text rounded-lg px-2.5 py-1.5 self-start max-w-[85%] chat-markdown">
						{@html marked.parse(msg.content)}
					</div>
				{/if}
			{/each}
			{#if llm.loading}
				<div class="flex items-center gap-1.5 text-text-dim text-xs px-1">
					<Loader2 size={12} class="animate-spin" />
					<span>Denkt nach…</span>
				</div>
			{/if}
		{/if}
		<div bind:this={messagesEnd}></div>
	</div>

	<!-- Error -->
	{#if llm.error}
		<div class="px-3 py-1.5 text-[10px] text-negative bg-negative/5 border-t border-negative/20 break-words">
			{llm.error}
		</div>
	{/if}

	<!-- Input -->
	<div class="px-3 py-2 border-t border-border">
		<div class="flex items-end gap-1.5">
			<textarea
				bind:value={inputText}
				onkeydown={handleKeydown}
				placeholder={llm.apiKey ? 'Nachricht eingeben…' : 'API-Key fehlt'}
				disabled={!llm.apiKey || llm.loading}
				rows={1}
				class="flex-1 bg-bg-input border border-border rounded px-2 py-1.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-accent resize-none min-h-[30px] max-h-[80px] overflow-auto disabled:opacity-40"
			></textarea>
			<button
				onclick={handleSend}
				disabled={!inputText.trim() || !llm.apiKey || llm.loading}
				class="p-1.5 rounded bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
			>
				<Send size={13} />
			</button>
		</div>
	</div>
</div>

<style>
	:global(.chat-markdown p) {
		margin: 0.3em 0;
	}
	:global(.chat-markdown p:first-child) {
		margin-top: 0;
	}
	:global(.chat-markdown p:last-child) {
		margin-bottom: 0;
	}
	:global(.chat-markdown ul),
	:global(.chat-markdown ol) {
		margin: 0.3em 0;
		padding-left: 1.4em;
	}
	:global(.chat-markdown ul) {
		list-style: disc;
	}
	:global(.chat-markdown ol) {
		list-style: decimal;
	}
	:global(.chat-markdown li) {
		margin: 0.15em 0;
	}
	:global(.chat-markdown strong) {
		font-weight: 600;
	}
	:global(.chat-markdown em) {
		font-style: italic;
	}
	:global(.chat-markdown code) {
		background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.15));
		padding: 0.1em 0.35em;
		border-radius: 3px;
		font-size: 0.9em;
		font-family: ui-monospace, monospace;
	}
	:global(.chat-markdown pre) {
		background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.15));
		padding: 0.5em 0.6em;
		border-radius: 5px;
		overflow-x: auto;
		margin: 0.4em 0;
	}
	:global(.chat-markdown pre code) {
		background: none;
		padding: 0;
		font-size: 0.85em;
	}
	:global(.chat-markdown h1),
	:global(.chat-markdown h2),
	:global(.chat-markdown h3) {
		font-weight: 600;
		margin: 0.5em 0 0.2em;
	}
	:global(.chat-markdown h1) {
		font-size: 1.15em;
	}
	:global(.chat-markdown h2) {
		font-size: 1.05em;
	}
	:global(.chat-markdown h3) {
		font-size: 1em;
	}
	:global(.chat-markdown blockquote) {
		border-left: 2px solid var(--color-border, #444);
		padding-left: 0.6em;
		margin: 0.3em 0;
		opacity: 0.85;
	}
	:global(.chat-markdown table) {
		border-collapse: collapse;
		margin: 0.4em 0;
		width: 100%;
	}
	:global(.chat-markdown th),
	:global(.chat-markdown td) {
		border: 1px solid var(--color-border, #444);
		padding: 0.25em 0.5em;
		text-align: left;
	}
	:global(.chat-markdown th) {
		font-weight: 600;
	}
	:global(.chat-markdown hr) {
		border: none;
		border-top: 1px solid var(--color-border, #444);
		margin: 0.5em 0;
	}
	:global(.chat-markdown a) {
		color: var(--color-accent, #58a6ff);
		text-decoration: underline;
	}
</style>
