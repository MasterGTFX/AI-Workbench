import { useEffect, useMemo, useRef, useState } from "react";
import {
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";
import {
	ArrowLeft,
	Save,
	Play,
	Plus,
	Trash2,
	Copy,
	Check,
	X,
	Pencil,
	Loader2,
	FileJson,
	FileText,
	Clock,
	Cpu,
	Hash,
	Layers,
	ChevronDown,
	Eye,
	Sparkles,
	Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectItem } from "@/components/ui/select";
import { apiClient } from "@/api/client";
import RunDetails from "@/pages/RunDetails";
import type { Preset, Provider, SchemaField, Run } from "@/types";
import {
	formatDate,
	formatDuration,
	buildJsonSchema,
	copyToClipboard,
	copyToClipboardRich,
	renderMarkdownToHtml,
	jsonToMarkdown,
	downloadJson,
	downloadMarkdown,
} from "@/utils/helpers";
import {
	renderResultValue,
	getResultValueText,
} from "@/utils/resultRenderers";
import SchemaNestedEditor from "@/components/SchemaNestedEditor";
import toast from "react-hot-toast";

const FIELD_TYPES = [
	"string",
	"number",
	"integer",
	"boolean",
	"enum",
	"list[string]",
	"list[number]",
	"object",
	"list[object]",
];

const EMPTY_FIELD: SchemaField = {
	name: "",
	type: "string",
	required: true,
	description: "",
	enum_values: "",
	validation_hint: "",
	example: "",
	default_value: "",
	order: 0,
};

const EMPTY_PRESET: Partial<Preset> = {
	name: "New Preset",
	description: "",
	tags: "",
	system_prompt: "You are a helpful assistant.",
	user_prompt_template: "Process the following: {{input}}",
	stream: false,
	schema_fields: [],
};

export default function PresetEditor() {
	const { id } = useParams<{ id: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const isNew = id === "new";
	const presetId = isNew ? null : Number(id);

	const [preset, setPreset] = useState<Partial<Preset>>(EMPTY_PRESET);
	const [providers, setProviders] = useState<Provider[]>([]);
	const [loading, setLoading] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState(
		searchParams.get("tab") || (isNew ? "configure" : "run"),
	);
	const [selectedFieldId, setSelectedFieldId] = useState<number | "new" | null>(
		null,
	);
	const [fieldForm, setFieldForm] = useState<SchemaField>({ ...EMPTY_FIELD });

	// Run tab state
	const [runInput, setRunInput] = useState("");
	const [runResult, setRunResult] = useState<Run | null>(null);
	const [running, setRunning] = useState(false);
	const [runSystemPrompt, setRunSystemPrompt] = useState("");
	const [runUserPromptTemplate, setRunUserPromptTemplate] = useState("");
	const [attachedImages, setAttachedImages] = useState<{ name: string; dataUrl: string }[]>([]);
	const imageInputRef = useRef<HTMLInputElement>(null);

	// History tab state
	const [runs, setRuns] = useState<Run[]>([]);
	const [runsLoading, setRunsLoading] = useState(false);
	const [viewRunId, setViewRunId] = useState<number | null>(null);

	// Quick test state
	const [testInput, setTestInput] = useState("");
	const [testRunning, setTestRunning] = useState(false);

	// AI generation state
	const [aiMode, setAiMode] = useState(isNew);
	const [aiPrompt, setAiPrompt] = useState("");
	const [aiGenerating, setAiGenerating] = useState(false);
	const [aiProviderId, setAiProviderId] = useState<string>("");

	useEffect(() => {
		fetchProviders();
		if (presetId) {
			fetchPreset(presetId);
			fetchRuns(presetId);
		} else {
			setLoading(false);
		}
	}, [presetId]);

	useEffect(() => {
		setRunSystemPrompt(preset.system_prompt || "");
		setRunUserPromptTemplate(preset.user_prompt_template || "");
	}, [preset.system_prompt, preset.user_prompt_template]);

	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab) setActiveTab(tab);
	}, [searchParams]);

	useEffect(() => {
		if (
			location.state &&
			typeof location.state === "object" &&
			"run" in location.state
		) {
			const run = location.state.run as Run;
			setRunInput(run.input);
			setRunResult(run);
			handleTabChange("run");
			navigate(location.pathname + location.search, {
				replace: true,
				state: {},
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.state]);

	async function fetchProviders() {
		try {
			const res = await apiClient.get<Provider[]>("/providers");
			setProviders(res.data);
		} catch {
			toast.error("Failed to load providers");
		}
	}

	async function fetchPreset(pid: number) {
		setLoading(true);
		try {
			const res = await apiClient.get<Preset>(`/presets/${pid}`);
			setPreset(res.data);
		} catch {
			toast.error("Failed to load preset");
		} finally {
			setLoading(false);
		}
	}

	async function fetchRuns(pid: number) {
		setRunsLoading(true);
		try {
			const res = await apiClient.get<Run[]>(`/runs?preset_id=${pid}`);
			setRuns(res.data);
		} catch {
			// ignore
		} finally {
			setRunsLoading(false);
		}
	}

	function handleTabChange(tab: string) {
		setActiveTab(tab);
		setSearchParams({ tab });
	}

	async function handleSave() {
		if (!preset.name) {
			toast.error("Preset name is required");
			return;
		}
		setSaving(true);
		try {
			const payload = {
				...preset,
				schema_fields: preset.schema_fields || [],
			};
			if (isNew) {
				const res = await apiClient.post<Preset>("/presets", payload);
				toast.success("Preset created");
				navigate(`/presets/${res.data.id}?tab=configure`);
			} else if (presetId) {
				await apiClient.put(`/presets/${presetId}`, payload);
				toast.success("Preset saved");
				if (presetId) fetchPreset(presetId);
			}
		} catch {
			toast.error("Failed to save preset");
		} finally {
			setSaving(false);
		}
	}

	async function handleGenerate() {
		if (!aiPrompt.trim()) {
			toast.error("Describe what you want the preset to do");
			return;
		}
		setAiGenerating(true);
		try {
			const res = await apiClient.post("/presets/generate/", {
				prompt: aiPrompt,
				provider_id: aiProviderId ? Number(aiProviderId) : undefined,
			});
			const data = res.data as {
				name: string;
				description?: string;
				tags: string;
				system_prompt?: string;
				user_prompt_template: string;
				schema_fields: SchemaField[];
			};
			setPreset({
				...EMPTY_PRESET,
				name: data.name,
				description: data.description,
				tags: data.tags,
				system_prompt: data.system_prompt,
				user_prompt_template: data.user_prompt_template,
				schema_fields: data.schema_fields.map((f, i) => ({ ...f, order: i })),
			});
			setAiMode(false);
			toast.success("Preset generated! Review and save.");
		} catch {
			toast.error("Failed to generate preset");
		} finally {
			setAiGenerating(false);
		}
	}

	function updatePreset(updates: Partial<Preset>) {
		setPreset((prev) => ({ ...prev, ...updates }));
	}

	// Schema field management
	function addField() {
		const newField: SchemaField = {
			...EMPTY_FIELD,
			order: (preset.schema_fields || []).length,
		};
		setFieldForm(newField);
		setSelectedFieldId("new");
	}

	function selectField(field: SchemaField) {
		setFieldForm({ ...field });
		setSelectedFieldId(field.id || null);
	}

	function saveField() {
		if (!fieldForm.name.trim()) {
			toast.error("Field name is required");
			return;
		}
		const fields = [...(preset.schema_fields || [])];
		if (selectedFieldId === "new") {
			const newField = { ...fieldForm, id: -(fields.length + 1) };
			fields.push(newField);
		} else {
			const idx = fields.findIndex((f) => f.id === selectedFieldId);
			if (idx >= 0) fields[idx] = { ...fieldForm };
		}
		updatePreset({ schema_fields: fields });
		setSelectedFieldId(null);
		setFieldForm({ ...EMPTY_FIELD });
	}

	function deleteField() {
		if (selectedFieldId == null || selectedFieldId === "new") {
			setSelectedFieldId(null);
			return;
		}
		const fields = (preset.schema_fields || []).filter(
			(f) => f.id !== selectedFieldId,
		);
		updatePreset({ schema_fields: fields });
		setSelectedFieldId(null);
	}

	function tryParseLength(jsonStr: string): number | null {
		try {
			return JSON.parse(jsonStr).length;
		} catch {
			return null;
		}
	}

	function moveField(index: number, direction: -1 | 1) {
		const fields = [...(preset.schema_fields || [])];
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= fields.length) return;
		[fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
		fields.forEach((f, i) => (f.order = i));
		updatePreset({ schema_fields: fields });
	}

	const jsonSchema = useMemo(() => {
		try {
			return buildJsonSchema(preset.schema_fields || []);
		} catch {
			return {};
		}
	}, [preset.schema_fields]);

	async function handleRun() {
		if (!presetId) {
			toast.error("Save the preset before running");
			return;
		}
		if (!runInput.trim() && attachedImages.length === 0) {
			toast.error("Input or an image is required");
			return;
		}
		setRunning(true);
		try {
			const overrides: Record<string, any> = {};
			if (
				runSystemPrompt.trim() !== "" &&
				runSystemPrompt !== (preset.system_prompt || "")
			) {
				overrides.system_prompt = runSystemPrompt;
			}
			if (
				runUserPromptTemplate.trim() !== "" &&
				runUserPromptTemplate !== (preset.user_prompt_template || "")
			) {
				overrides.user_prompt_template = runUserPromptTemplate;
			}
			const res = await apiClient.post<Run>(`/presets/${presetId}/run`, {
				input: runInput,
				images: attachedImages.map((img) => img.dataUrl),
				overrides: Object.keys(overrides).length ? overrides : undefined,
			});
			setRunResult(res.data);
			toast.success("Run completed");
			if (presetId) fetchRuns(presetId);
		} catch {
			toast.error("Run failed");
		} finally {
			setRunning(false);
		}
	}

	async function handleQuickTest() {
		if (!presetId) {
			toast.error("Save the preset before testing");
			return;
		}
		if (!testInput.trim()) {
			toast.error("Input is required");
			return;
		}
		setTestRunning(true);
		try {
			const res = await apiClient.post<Run>(`/presets/${presetId}/run`, {
				input: testInput,
			});
			toast.success(`Test completed - ${res.data.status}`);
		} catch {
			toast.error("Test failed");
		} finally {
			setTestRunning(false);
		}
	}

	async function handleDeleteRun(runId: number) {
		try {
			await apiClient.delete(`/runs/${runId}`);
			toast.success("Run deleted");
			if (presetId) fetchRuns(presetId);
		} catch {
			toast.error("Failed to delete run");
		}
	}

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Top bar */}
			<div className="flex flex-wrap items-center justify-between gap-y-2 border-b px-4 py-3 md:px-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => navigate("/")}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div className="flex items-center gap-2">
						<Input
							value={preset.name || ""}
							onChange={(e) => updatePreset({ name: e.target.value })}
							className="h-8 border-0 text-lg font-bold shadow-none focus-visible:ring-0 px-0"
							placeholder="Preset name"
						/>
						<Pencil className="h-4 w-4 text-slate-400" />
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{isNew && (
						<div className="flex items-center rounded-md border bg-slate-50 p-0.5">
							<Button
								variant={aiMode ? "default" : "ghost"}
								size="sm"
								onClick={() => setAiMode(true)}
								className={`gap-1.5 ${aiMode ? "bg-blue-600 hover:bg-blue-700" : ""}`}
							>
								<Sparkles className="h-3.5 w-3.5" />
								AI Mode
							</Button>
							<Button
								variant={!aiMode ? "default" : "ghost"}
								size="sm"
								onClick={() => setAiMode(false)}
								className={`gap-1.5 ${!aiMode ? "bg-slate-700 hover:bg-slate-800" : ""}`}
							>
								<Pencil className="h-3.5 w-3.5" />
								Manual
							</Button>
						</div>
					)}
					<div className="overflow-x-auto">
						<Tabs value={activeTab} onValueChange={handleTabChange}>
							<TabsList>
								<TabsTrigger value="run">Run</TabsTrigger>
								<TabsTrigger value="schema">Schema</TabsTrigger>
								<TabsTrigger value="configure">Configure</TabsTrigger>
								<TabsTrigger value="history">History</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
					<Button variant="outline" onClick={() => navigate("/")}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={saving}
						className="gap-2 bg-blue-600 hover:bg-blue-700"
					>
						{saving ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Save className="h-4 w-4" />
						)}
						Save Preset
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-auto p-4 md:p-6">
				{activeTab === "configure" && isNew && aiMode && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<div className="lg:col-span-3 flex flex-col items-center justify-start pt-12">
							<div className="w-full max-w-2xl space-y-6">
								<div className="text-center space-y-2">
									<div className="inline-flex items-center justify-center rounded-full bg-blue-50 p-3">
										<Wand2 className="h-6 w-6 text-blue-600" />
									</div>
									<h2 className="text-xl font-semibold text-slate-900">
										AI Preset Generator
									</h2>
									<p className="text-sm text-slate-500">
										Describe what you want and AI will generate the preset for
										you.
									</p>
								</div>

								<div className="rounded-lg border p-5 space-y-4">
									<div>
										<Label className="mb-1 block">
											What do you want this preset to do?
										</Label>
										<Textarea
											value={aiPrompt}
											onChange={(e) => setAiPrompt(e.target.value)}
											placeholder="e.g. Generate an App Store listing with title, subtitle, description, and keywords from app details"
											rows={6}
										/>
									</div>
									<div>
										<Label className="mb-1 block">Provider (optional)</Label>
										<Select
											value={aiProviderId}
											onValueChange={setAiProviderId}
											placeholder="Auto-select active provider"
										>
											<SelectItem value="">Auto-select</SelectItem>
											{providers.map((p) => (
												<SelectItem key={p.id} value={String(p.id)}>
													{p.name}
												</SelectItem>
											))}
										</Select>
									</div>
									<Button
										onClick={handleGenerate}
										disabled={aiGenerating}
										className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
									>
										{aiGenerating ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Wand2 className="h-4 w-4" />
										)}
										Generate Preset
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === "configure" && (!isNew || !aiMode) && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<div className="lg:col-span-2 space-y-6">
							{/* Details */}
							<div className="rounded-lg border p-5">
								<h3 className="mb-4 text-sm font-semibold text-slate-900">
									Details
								</h3>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="sm:col-span-2">
										<Label className="mb-1 block">Description</Label>
										<Input
											value={preset.description || ""}
											onChange={(e) =>
												updatePreset({ description: e.target.value })
											}
											placeholder="Short description of what this preset does"
										/>
									</div>
									<div>
										<Label className="mb-1 block">Tags</Label>
										<Input
											value={preset.tags || ""}
											onChange={(e) => updatePreset({ tags: e.target.value })}
											placeholder="bug,email,support"
										/>
									</div>
								</div>
							</div>

							{/* Prompts */}
							<div className="rounded-lg border p-5">
								<h3 className="mb-4 text-sm font-semibold text-slate-900">
									Prompts
								</h3>
								<div className="space-y-4">
									<div>
										<Label className="mb-1 block">System Prompt</Label>
										<Textarea
											value={preset.system_prompt || ""}
											onChange={(e) =>
												updatePreset({ system_prompt: e.target.value })
											}
											placeholder="You are a helpful assistant..."
											rows={4}
										/>
									</div>
									<div>
										<Label className="mb-1 block">User Prompt Template</Label>
										<Textarea
											value={preset.user_prompt_template || ""}
											onChange={(e) =>
												updatePreset({ user_prompt_template: e.target.value })
											}
											placeholder="Analyze the following: {{input}}"
											rows={4}
										/>
										<p className="mt-1 text-xs text-slate-500">
											Use {"{{input}}"} to insert the user input at runtime.
										</p>
									</div>
								</div>
							</div>

							{/* Parameters */}
							<div className="rounded-lg border p-5">
								<h3 className="mb-4 text-sm font-semibold text-slate-900">
									Default Settings
								</h3>
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
									<div>
										<Label className="mb-1 block">Temperature</Label>
										<Input
											type="number"
											step="0.1"
											value={preset.temperature ?? ""}
											onChange={(e) => {
												const val = e.target.value;
												updatePreset({
													temperature: val === "" ? null : Number(val),
												});
											}}
										/>
									</div>
									<div>
										<Label className="mb-1 block">Max Completion Tokens</Label>
										<Input
											type="number"
											value={preset.max_completion_tokens ?? ""}
											onChange={(e) => {
												const val = e.target.value;
												updatePreset({
													max_completion_tokens:
														val === "" ? null : Number(val),
												});
											}}
										/>
									</div>
									<div>
										<Label className="mb-1 block">Top P</Label>
										<Input
											type="number"
											step="0.1"
											value={preset.top_p ?? ""}
											onChange={(e) => {
												const val = e.target.value;
												updatePreset({
													top_p: val === "" ? null : Number(val),
												});
											}}
										/>
									</div>
									<div>
										<Label className="mb-1 block">Frequency Penalty</Label>
										<Input
											type="number"
											step="0.1"
											value={preset.frequency_penalty ?? ""}
											onChange={(e) => {
												const val = e.target.value;
												updatePreset({
													frequency_penalty: val === "" ? null : Number(val),
												});
											}}
										/>
									</div>
									<div>
										<Label className="mb-1 block">Presence Penalty</Label>
										<Input
											type="number"
											step="0.1"
											value={preset.presence_penalty ?? ""}
											onChange={(e) => {
												const val = e.target.value;
												updatePreset({
													presence_penalty: val === "" ? null : Number(val),
												});
											}}
										/>
									</div>
									<div>
										<Label className="mb-1 block">Reasoning Effort</Label>
										<Select
											value={preset.reasoning_effort || ""}
											onValueChange={(v) =>
												updatePreset({ reasoning_effort: v || null })
											}
										>
											<SelectItem value="">Default</SelectItem>
											<SelectItem value="none">none</SelectItem>
											<SelectItem value="low">low</SelectItem>
											<SelectItem value="minimal">minimal</SelectItem>
											<SelectItem value="medium">medium</SelectItem>
											<SelectItem value="high">high</SelectItem>
											<SelectItem value="xhigh">xhigh</SelectItem>
										</Select>
									</div>
									<div className="flex items-end gap-3">
										<Switch
											checked={preset.stream || false}
											onCheckedChange={(v) => updatePreset({ stream: v })}
										/>
										<Label>Stream response</Label>
									</div>
								</div>
							</div>
						</div>

						{/* Quick Test */}
						<div className="rounded-lg border p-5">
							<h3 className="mb-4 text-sm font-semibold text-slate-900">
								Quick Test
							</h3>
							<Textarea
								value={testInput}
								onChange={(e) => setTestInput(e.target.value)}
								placeholder="Paste logs or input here..."
								rows={8}
								className="mb-3"
							/>
							<Button
								onClick={handleQuickTest}
								disabled={testRunning}
								className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
							>
								{testRunning ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Play className="h-4 w-4" />
								)}
								Run Test
							</Button>
						</div>
					</div>
				)}

				{activeTab === "schema" && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-full">
						{/* Fields list */}
						<div className="rounded-lg border p-4">
							<div className="mb-3 flex items-center justify-between">
								<h3 className="text-sm font-semibold text-slate-900">Fields</h3>
								<Button
									size="sm"
									variant="outline"
									onClick={addField}
									className="gap-1"
								>
									<Plus className="h-3 w-3" /> Add Field
								</Button>
							</div>
							<div className="space-y-1">
								{(preset.schema_fields || []).map((field, idx) => (
									<div
										key={field.id || idx}
										onClick={() => selectField(field)}
										className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
											selectedFieldId === field.id
												? "bg-blue-50 text-blue-700"
												: "hover:bg-slate-50 text-slate-700"
										}`}
									>
										<div className="flex items-center gap-2">
											<span className="font-medium">{field.name}</span>
											<span className="text-xs text-slate-500">
												{field.type}
											</span>
											{(field.type === "object" || field.type === "list[object]") &&
												field.properties && (
													<span className="text-xs text-blue-600">
														({tryParseLength(field.properties)} props)
													</span>
												)}
										</div>
										<div className="flex items-center gap-1">
											{field.required && (
												<span className="text-xs text-red-500">*</span>
											)}
											<button
												onClick={(e) => {
													e.stopPropagation();
													moveField(idx, -1);
												}}
												className="rounded p-0.5 hover:bg-slate-200 disabled:opacity-30"
												disabled={idx === 0}
											>
												<ChevronDown className="h-3 w-3 rotate-180" />
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													moveField(idx, 1);
												}}
												className="rounded p-0.5 hover:bg-slate-200 disabled:opacity-30"
												disabled={
													idx === (preset.schema_fields || []).length - 1
												}
											>
												<ChevronDown className="h-3 w-3" />
											</button>
										</div>
									</div>
								))}
								{(preset.schema_fields || []).length === 0 && (
									<div className="py-8 text-center text-sm text-slate-500">
										No fields yet. Click "Add Field" to start.
									</div>
								)}
							</div>
						</div>

						{/* Field details */}
						<div className="rounded-lg border p-4">
							<h3 className="mb-4 text-sm font-semibold text-slate-900">
								Field Details
							</h3>
							{selectedFieldId != null ? (
								<div className="space-y-4">
									<div>
										<Label className="mb-1 block">Name</Label>
										<Input
											value={fieldForm.name}
											onChange={(e) =>
												setFieldForm({ ...fieldForm, name: e.target.value })
											}
											placeholder="field_name"
										/>
									</div>
									<div>
										<Label className="mb-1 block">Type</Label>
										<Select
											value={fieldForm.type}
											onValueChange={(v) =>
												setFieldForm({ ...fieldForm, type: v })
											}
										>
											{FIELD_TYPES.map((t) => (
												<SelectItem key={t} value={t}>
													{t}
												</SelectItem>
											))}
										</Select>
									</div>
									<div className="flex items-center gap-2">
										<Switch
											checked={fieldForm.required}
											onCheckedChange={(v) =>
												setFieldForm({ ...fieldForm, required: v })
											}
										/>
										<Label>Required</Label>
									</div>
									<div>
										<Label className="mb-1 block">Description</Label>
										<Input
											value={fieldForm.description || ""}
											onChange={(e) =>
												setFieldForm({
													...fieldForm,
													description: e.target.value,
												})
											}
											placeholder="Field description"
										/>
									</div>
									{fieldForm.type === "enum" && (
										<div>
											<Label className="mb-1 block">
												Enum Values (comma separated)
											</Label>
											<Input
												value={fieldForm.enum_values || ""}
												onChange={(e) =>
													setFieldForm({
														...fieldForm,
														enum_values: e.target.value,
													})
												}
												placeholder="low, medium, high"
											/>
										</div>
									)}
									<div>
										<Label className="mb-1 block">Validation Hint</Label>
										<Input
											value={fieldForm.validation_hint || ""}
											onChange={(e) =>
												setFieldForm({
													...fieldForm,
													validation_hint: e.target.value,
												})
											}
											placeholder="e.g. max length 100"
										/>
									</div>
									<div>
										<Label className="mb-1 block">Example</Label>
										<Input
											value={fieldForm.example || ""}
											onChange={(e) =>
												setFieldForm({ ...fieldForm, example: e.target.value })
											}
											placeholder="Example value"
										/>
									</div>
									<div>
										<Label className="mb-1 block">Default Value</Label>
										<Input
											value={fieldForm.default_value || ""}
											onChange={(e) =>
												setFieldForm({
													...fieldForm,
													default_value: e.target.value,
												})
											}
											placeholder="Default (optional)"
										/>
									</div>
									{(fieldForm.type === "object" || fieldForm.type === "list[object]") && (
										<div>
											<Label className="mb-1 block">Object Properties</Label>
											<SchemaNestedEditor
												value={fieldForm.properties || ""}
												onChange={(v) =>
													setFieldForm({
														...fieldForm,
														properties: v || undefined,
													})
												}
											/>
										</div>
									)}
									<div className="flex gap-2 pt-2">
										<Button
											onClick={saveField}
											className="gap-1 bg-blue-600 hover:bg-blue-700"
										>
											<Check className="h-4 w-4" /> Save Field
										</Button>
										<Button
											variant="outline"
											onClick={deleteField}
											className="gap-1 text-red-600 hover:text-red-700"
										>
											<Trash2 className="h-4 w-4" /> Delete
										</Button>
										<Button
											variant="ghost"
											onClick={() => setSelectedFieldId(null)}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<div className="py-8 text-center text-sm text-slate-500">
									Select a field to edit its details.
								</div>
							)}
						</div>

						{/* Schema preview */}
						<div className="rounded-lg border p-4">
							<h3 className="mb-4 text-sm font-semibold text-slate-900">
								Schema Preview
							</h3>
							<pre className="rounded-md bg-slate-900 p-4 text-xs text-green-400 overflow-auto max-h-[600px]">
								{JSON.stringify(jsonSchema, null, 2)}
							</pre>
						</div>
					</div>
				)}

				{activeTab === "run" && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 h-full">
						{/* Input panel */}
						<div className="space-y-4">
							<div className="rounded-lg border p-5">
								<h3 className="mb-3 text-sm font-semibold text-slate-900">
									Input
								</h3>
								<Textarea
									value={runInput}
									onChange={(e) => setRunInput(e.target.value)}
									placeholder="Paste logs or input here..."
									rows={12}
								/>
								<div className="mt-3 flex items-center gap-2">
									<input
										ref={imageInputRef}
										type="file"
										accept="image/*"
										multiple
										className="sr-only"
										onChange={async (e) => {
											const files = e.target.files;
											if (!files || files.length === 0) return;
											const fileArray = Array.from(files);
											const results = await Promise.all(
												fileArray.map((file) =>
													new Promise<{ name: string; dataUrl: string } | null>((resolve) => {
														const reader = new FileReader();
														reader.onload = (ev) => {
															const dataUrl = ev.target?.result as string | undefined;
															if (dataUrl) {
																resolve({ name: file.name, dataUrl });
															} else {
																resolve(null);
															}
														};
														reader.onerror = () => resolve(null);
														reader.readAsDataURL(file);
													}),
												),
											);
											const loaded = results.filter((r): r is { name: string; dataUrl: string } => r !== null);
											if (loaded.length < fileArray.length) {
												toast.error(`Failed to load ${fileArray.length - loaded.length} image(s)`);
											}
											if (loaded.length > 0) {
												setAttachedImages((prev) => [...prev, ...loaded]);
											}
											e.target.value = "";
										}}
									/>
									<Button
										variant="outline"
										size="sm"
										className="gap-1"
										onClick={() => imageInputRef.current?.click()}
									>
										<Plus className="h-4 w-4" /> Add Image
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setRunInput("");
											setAttachedImages([]);
										}}
									>
										Clear
									</Button>
								</div>
								{attachedImages.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-2">
										{attachedImages.map((img, idx) => (
											<div key={idx} className="relative group">
												<img
													src={img.dataUrl}
													alt={img.name}
													className="h-16 w-16 rounded-md object-cover border"
												/>
												<button
													onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
													className="absolute -right-1 -top-1 rounded-full bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<X className="h-3 w-3" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							<div className="rounded-lg border p-5">
								<h3 className="mb-3 text-sm font-semibold text-slate-900">
									Run Settings
								</h3>
								<div className="space-y-3">
									<div>
										<Label className="mb-1 block text-xs">Provider</Label>
										<p className="text-sm text-slate-700">
											{providers.find((p) => p.active)?.name || "None"}
										</p>
										<p className="mt-1 text-xs text-slate-500">
											Uses the currently active provider.
										</p>
									</div>
									<div>
										<Label className="mb-1 block text-xs">System Prompt</Label>
										<Textarea
											value={runSystemPrompt}
											onChange={(e) => setRunSystemPrompt(e.target.value)}
											placeholder={
												preset.system_prompt || "You are a helpful assistant..."
											}
											rows={4}
										/>
									</div>
									<div>
										<Label className="mb-1 block text-xs">
											User Prompt Template
										</Label>
										<Textarea
											value={runUserPromptTemplate}
											onChange={(e) => setRunUserPromptTemplate(e.target.value)}
											placeholder={
												preset.user_prompt_template ||
												"Analyze the following: {{input}}"
											}
											rows={4}
										/>
										<p className="mt-1 text-xs text-slate-500">
											Use {"{{input}}"} to insert the user input at runtime.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Result panel */}
						<div className="space-y-4">
							<div className="rounded-lg border p-5">
								<div className="mb-3 flex items-center justify-between">
									<h3 className="text-sm font-semibold text-slate-900">
										Result
									</h3>
									<div className="flex gap-1">
										<Button
											size="sm"
											variant="outline"
											className="gap-1"
											onClick={handleRun}
											disabled={running}
										>
											{running ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Play className="h-4 w-4" />
											)}
											Run
										</Button>
									</div>
								</div>

								{runResult ? (
									<div className="space-y-4">
										<Tabs defaultValue="result">
											<TabsList>
												<TabsTrigger value="result">Result</TabsTrigger>
												<TabsTrigger value="raw">Raw JSON</TabsTrigger>
											</TabsList>
											<TabsContent value="result">
												{runResult.output ? (
													<div className="space-y-3">
														{(() => {
															const output = runResult.output;
															if (!output) return null;
															try {
																const parsed = JSON.parse(output);
                                                                if (typeof parsed === "string") {
                                                                    return (
                                                                        <div className="rounded-md border bg-white p-4 shadow-sm">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                                    Value
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 gap-1 text-slate-500"
                                                                                    onClick={() =>
                                                                                        copyToClipboardRich(
                                                                                            parsed,
                                                                                            renderMarkdownToHtml(parsed),
                                                                                        ).then(() => toast.success("Copied"))
                                                                                    }
                                                                                >
                                                                                    <Copy className="h-3.5 w-3.5" />
                                                                                    Copy
                                                                                </Button>
                                                                            </div>
                                                                            <div
                                                                                className="markdown-body text-sm text-slate-800"
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: renderMarkdownToHtml(parsed),
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    );
                                                                }
                                                                if (
                                                                    typeof parsed !== "object" ||
                                                                    parsed === null
                                                                ) {
                                                                    return (
                                                                        <div className="rounded-md border bg-slate-50 p-4">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                                    Value
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 gap-1 text-slate-500"
                                                                                    onClick={() =>
                                                                                        copyToClipboard(output).then(() =>
                                                                                            toast.success("Copied"),
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Copy className="h-3.5 w-3.5" />
                                                                                    Copy
                                                                                </Button>
                                                                            </div>
                                                                            <pre className="whitespace-pre-wrap text-sm text-slate-800">
                                                                                {JSON.stringify(parsed, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    );
                                                                }
                                                                if (Array.isArray(parsed)) {
                                                                    return (
                                                                        <div className="rounded-md border bg-slate-50 p-4">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                                    Value
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 gap-1 text-slate-500"
                                                                                    onClick={() =>
                                                                                        copyToClipboard(getResultValueText(parsed)).then(() =>
                                                                                            toast.success("Copied"),
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Copy className="h-3.5 w-3.5" />
                                                                                    Copy
                                                                                </Button>
                                                                            </div>
                                                                            {renderResultValue(parsed)}
                                                                        </div>
                                                                    );
                                                                }
                                                                return Object.entries(parsed).map(
                                                                    ([key, value]) => (
                                                                        <div
                                                                            key={key}
                                                                            className="rounded-md border bg-white p-4 shadow-sm"
                                                                        >
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                                    {key}
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 gap-1 text-slate-500"
                                                                                    onClick={() => {
                                                                                        const text = getResultValueText(value);
                                                                                        const promise =
                                                                                            typeof value === "string"
                                                                                                ? copyToClipboardRich(
                                                                                                      text,
                                                                                                      renderMarkdownToHtml(text),
                                                                                                  )
                                                                                                : copyToClipboard(text);
                                                                                        promise.then(() =>
                                                                                            toast.success(`Copied ${key}`),
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <Copy className="h-3.5 w-3.5" />
                                                                                    Copy
                                                                                </Button>
                                                                            </div>
                                                                            <div className="text-sm">
                                                                                {renderResultValue(value)}
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                );
                                                            } catch {
                                                                return (
                                                                    <div className="rounded-md border bg-slate-50 p-4">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                                Value
                                                                            </span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 gap-1 text-slate-500"
                                                                                onClick={() =>
                                                                                    copyToClipboardRich(
                                                                                        output,
                                                                                        renderMarkdownToHtml(output),
                                                                                    ).then(() => toast.success("Copied"))
                                                                                }
                                                                            >
                                                                                <Copy className="h-3.5 w-3.5" />
                                                                                Copy
                                                                            </Button>
                                                                        </div>
                                                                        <div
                                                                            className="markdown-body text-sm text-slate-800"
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: renderMarkdownToHtml(output),
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-500">
                                                        No output available.
                                                    </div>
                                                )}
                                            </TabsContent>
                                            <TabsContent value="raw">
                                                <div className="rounded-md border bg-slate-50 p-4">
                                                    <pre className="whitespace-pre-wrap text-sm text-slate-800">
                                                        {runResult.raw_response ||
                                                            runResult.output ||
                                                            "No output"}
                                                    </pre>
                                                </div>
											</TabsContent>
										</Tabs>

										{/* Actions */}
										<div className="flex flex-wrap gap-2">
											<Button
												variant="outline"
												size="sm"
												className="gap-1"
												onClick={() => {
													copyToClipboard(runResult.output || "").then(() =>
														toast.success("Copied JSON"),
													);
												}}
											>
												<Copy className="h-3 w-3" /> Copy JSON
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="gap-1"
												onClick={() => {
													const md = jsonToMarkdown(runResult.output || "");
													copyToClipboard(md).then(() =>
														toast.success("Copied Markdown"),
													);
												}}
											>
												<FileText className="h-3 w-3" /> Copy Markdown
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="gap-1"
												onClick={() =>
													downloadJson(
														JSON.parse(runResult.output || "{}"),
														`result-${runResult.id}.json`,
													)
												}
											>
												<FileJson className="h-3 w-3" /> Download JSON
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="gap-1"
												onClick={() =>
													downloadMarkdown(
														jsonToMarkdown(runResult.output || ""),
														`result-${runResult.id}.md`,
													)
												}
											>
												<FileText className="h-3 w-3" /> Download Markdown
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="gap-1"
												onClick={() => setViewRunId(runResult.id)}
											>
												<Eye className="h-3 w-3" /> View Details
											</Button>
										</div>

										{/* Validation */}
										<div className="rounded-md border p-3">
											<div className="mb-1 text-xs font-semibold text-slate-500">
												Validation
											</div>
											<div className="flex items-center gap-2 text-sm">
												{runResult.status === "success" ? (
													<>
														<Check className="h-4 w-4 text-green-600" />
														<span className="text-green-700">Schema valid</span>
													</>
												) : (
													<>
														<X className="h-4 w-4 text-red-600" />
														<span className="text-red-700">
															{runResult.error || "Validation failed"}
														</span>
													</>
												)}
											</div>
										</div>

										{/* Run Info */}
										<div className="rounded-md border p-3">
											<div className="mb-2 text-xs font-semibold text-slate-500">
												Run Info
											</div>
											<div className="grid grid-cols-2 gap-2 text-xs">
												<div className="flex items-center gap-1 text-slate-600">
													<Clock className="h-3 w-3" />{" "}
													{formatDate(runResult.created_at)}
												</div>
												<div className="flex items-center gap-1 text-slate-600">
													<Cpu className="h-3 w-3" /> {runResult.model}
												</div>
												<div className="flex items-center gap-1 text-slate-600">
													<Hash className="h-3 w-3" /> Tokens:{" "}
													{(runResult.tokens_prompt || 0) +
														(runResult.tokens_completion || 0)}
												</div>
												<div className="flex items-center gap-1 text-slate-600">
													<Layers className="h-3 w-3" /> Duration:{" "}
													{formatDuration(runResult.duration_ms)}
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className="flex h-48 items-center justify-center text-sm text-slate-500">
										Run the preset to see results here.
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{activeTab === "history" && (
					<div>
						<h3 className="mb-4 text-lg font-semibold text-slate-900">
							Run History
						</h3>
						{runsLoading ? (
							<div className="flex h-64 items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
							</div>
						) : runs.length === 0 ? (
							<div className="flex h-64 items-center justify-center text-slate-500">
								No runs yet.
							</div>
						) : (
							<div className="overflow-x-auto rounded-lg border">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-slate-50">
											<th className="px-4 py-3 text-left font-medium text-slate-600">
												Date
											</th>
											<th className="px-4 py-3 text-left font-medium text-slate-600">
												Input
											</th>
											<th className="px-4 py-3 text-left font-medium text-slate-600">
												Status
											</th>
											<th className="px-4 py-3 text-left font-medium text-slate-600">
												Model
											</th>
											<th className="px-4 py-3 text-left font-medium text-slate-600">
												Duration
											</th>
											<th className="px-4 py-3 text-left font-medium text-slate-600">
												Tokens
											</th>
											<th className="px-4 py-3 text-right font-medium text-slate-600">
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{runs.map((run) => (
											<tr
												key={run.id}
												className="border-b hover:bg-slate-50 cursor-pointer"
												onClick={() => setViewRunId(run.id)}
											>
												<td className="px-4 py-3 whitespace-nowrap text-slate-600">
													{formatDate(run.created_at)}
												</td>
												<td className="px-4 py-3 max-w-xs truncate text-slate-600">
													{run.input}
												</td>
												<td className="px-4 py-3">
													<Badge
														variant={
															run.status === "success" ? "success" : "error"
														}
													>
														{run.status}
													</Badge>
												</td>
												<td className="px-4 py-3 text-slate-600">
													{run.model}
												</td>
												<td className="px-4 py-3 text-slate-600">
													{formatDuration(run.duration_ms)}
												</td>
												<td className="px-4 py-3 text-slate-600">
													{(run.tokens_prompt || 0) +
														(run.tokens_completion || 0)}
												</td>
												<td className="px-4 py-3 text-right">
													<div className="flex justify-end gap-1">
														<Button
															size="icon"
															variant="ghost"
															onClick={() => setViewRunId(run.id)}
														>
															<Eye className="h-4 w-4 text-blue-600" />
														</Button>
														<Button
															size="icon"
															variant="ghost"
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteRun(run.id);
															}}
														>
															<Trash2 className="h-4 w-4 text-red-600" />
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Run Details Drawer */}
			{viewRunId && (
				<RunDetails
					runId={viewRunId}
					open={true}
					onClose={() => setViewRunId(null)}
					onRunAgain={(run) => {
						setRunInput(run.input);
						setRunResult(run);
						handleTabChange("run");
						setViewRunId(null);
					}}
				/>
			)}
		</div>
	);
}
