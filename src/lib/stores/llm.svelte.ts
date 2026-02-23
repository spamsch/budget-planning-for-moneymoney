import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, ChatMessage } from '$lib/types';

class LlmStore {
	apiKey = $state('');
	model = $state('gpt-4.1-nano');
	messages = $state<ChatMessage[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	configLoaded = $state(false);

	async loadConfig() {
		try {
			const config = await invoke<AppConfig>('load_app_config');
			this.apiKey = config.openaiApiKey;
			this.model = config.openaiModel;
			this.configLoaded = true;
		} catch (e) {
			console.error('Failed to load app config:', e);
		}
	}

	async saveConfig() {
		try {
			await invoke('save_app_config', {
				config: {
					openai_api_key: this.apiKey,
					openai_model: this.model
				}
			});
		} catch (e) {
			console.error('Failed to save app config:', e);
		}
	}

	async sendMessage(userText: string, systemPrompt: string) {
		this.error = null;
		this.messages.push({ role: 'user', content: userText });
		this.loading = true;

		try {
			// Build messages array: system prompt + conversation history
			const apiMessages: ChatMessage[] = [
				{ role: 'system', content: systemPrompt },
				...this.messages
			];

			const response = await invoke<string>('chat_completion', {
				apiKey: this.apiKey,
				model: this.model,
				messages: apiMessages
			});

			this.messages.push({ role: 'assistant', content: response });
		} catch (e) {
			this.error = String(e);
			// Remove the user message that failed
			this.messages.pop();
		} finally {
			this.loading = false;
		}
	}

	clearChat() {
		this.messages = [];
		this.error = null;
	}
}

export const llm = new LlmStore();
