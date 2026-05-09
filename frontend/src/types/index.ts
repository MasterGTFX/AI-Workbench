export interface Provider {
	id: number;
	name: string;
	base_url: string;
	api_key?: string;
	default_model?: string;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface ModelItem {
	id: string;
}

export interface SchemaField {
	id?: number;
	preset_id?: number;
	name: string;
	type: string;
	required: boolean;
	description?: string;
	enum_values?: string;
	validation_hint?: string;
	example?: string;
	default_value?: string;
	properties?: string;
	order: number;
}

export interface Preset {
	id: number;
	name: string;
	description?: string;
	tags: string;
	system_prompt?: string;
	user_prompt_template: string;
	temperature?: number | null;
	max_completion_tokens?: number | null;
	top_p?: number | null;
	frequency_penalty?: number | null;
	presence_penalty?: number | null;
	reasoning_effort?: string | null;
	stream: boolean;
	schema_fields: SchemaField[];
	created_at: string;
	updated_at: string;
}

export interface Run {
	id: number;
	preset_id: number;
	preset?: Preset;
	input: string;
	output?: string;
	raw_response?: string;
	status: string;
	model: string;
	duration_ms?: number;
	tokens_prompt?: number;
	tokens_completion?: number;
	error?: string;
	created_at: string;
}

export interface PresetGenerateRequest {
	prompt: string;
	provider_id?: number;
}

export interface PresetGenerateResponse {
	name: string;
	description?: string;
	tags: string;
	system_prompt?: string;
	user_prompt_template: string;
	schema_fields: SchemaField[];
}
