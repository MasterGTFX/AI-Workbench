import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectItem } from "@/components/ui/select";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import type { SchemaField } from "@/types";

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

function emptyField(): SchemaField {
	return {
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
}

interface SchemaNestedEditorProps {
	value: string;
	onChange: (value: string) => void;
	depth?: number;
}

export default function SchemaNestedEditor({
	value,
	onChange,
	depth = 0,
}: SchemaNestedEditorProps) {
	const fields = useMemo(() => {
		try {
			return JSON.parse(value || "[]") as SchemaField[];
		} catch {
			return [] as SchemaField[];
		}
	}, [value]);

	const [expandedIdx, setExpandedIdx] = useState<number | "new" | null>(null);
	const [draft, setDraft] = useState<SchemaField>(emptyField());

	const updateFields = (newFields: SchemaField[]) => {
		onChange(JSON.stringify(newFields));
	};

	const handleAdd = () => {
		setDraft(emptyField());
		setExpandedIdx("new");
	};

	const handleSave = () => {
		if (!draft.name.trim()) return;
		let newFields: SchemaField[];
		if (expandedIdx === "new") {
			newFields = [...fields, { ...draft, order: fields.length }];
		} else if (expandedIdx !== null) {
			newFields = fields.map((f, i) => (i === expandedIdx ? { ...draft } : f));
		} else {
			return;
		}
		updateFields(newFields);
		setExpandedIdx(null);
		setDraft(emptyField());
	};

	const handleDelete = (idx: number) => {
		const newFields = fields.filter((_, i) => i !== idx);
		updateFields(newFields);
		if (expandedIdx === idx) {
			setExpandedIdx(null);
		}
	};

	const isObjectType = (t: string) => t === "object" || t === "list[object]";

	const propCount = (f: SchemaField) => {
		if (!isObjectType(f.type) || !f.properties) return null;
		try {
			return JSON.parse(f.properties).length;
		} catch {
			return null;
		}
	};

	const renderForm = () => (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<div>
					<Label className="text-xs">Name</Label>
					<Input
						value={draft.name}
						onChange={(e) => setDraft({ ...draft, name: e.target.value })}
						placeholder="property_name"
						className="h-8"
					/>
				</div>
				<div>
					<Label className="text-xs">Type</Label>
					<Select
						value={draft.type}
						onValueChange={(v) => setDraft({ ...draft, type: v })}
					>
						{FIELD_TYPES.map((t) => (
							<SelectItem key={t} value={t}>
								{t}
							</SelectItem>
						))}
					</Select>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Switch
					checked={draft.required}
					onCheckedChange={(v) => setDraft({ ...draft, required: v })}
				/>
				<Label className="text-xs">Required</Label>
			</div>
			<div>
				<Label className="text-xs">Description</Label>
				<Input
					value={draft.description || ""}
					onChange={(e) =>
						setDraft({ ...draft, description: e.target.value })
					}
					placeholder="Description"
					className="h-8"
				/>
			</div>
			{draft.type === "enum" && (
				<div>
					<Label className="text-xs">Enum Values (comma separated)</Label>
					<Input
						value={draft.enum_values || ""}
						onChange={(e) =>
							setDraft({ ...draft, enum_values: e.target.value })
						}
						placeholder="low, medium, high"
						className="h-8"
					/>
				</div>
			)}
			<div>
				<Label className="text-xs">Example</Label>
				<Input
					value={draft.example || ""}
					onChange={(e) =>
						setDraft({ ...draft, example: e.target.value })
					}
					placeholder="Example value"
					className="h-8"
				/>
			</div>

			{isObjectType(draft.type) && (
				<div>
					<Label className="text-xs mb-1 block">Nested Properties</Label>
					<SchemaNestedEditor
						value={draft.properties || ""}
						onChange={(v) =>
							setDraft({ ...draft, properties: v || undefined })
						}
						depth={depth + 1}
					/>
				</div>
			)}

			<div className="flex gap-2 pt-1">
				<Button size="sm" onClick={handleSave} className="h-7">
					Save
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						setExpandedIdx(null);
						setDraft(emptyField());
					}}
					className="h-7"
				>
					Cancel
				</Button>
			</div>
		</div>
	);

	return (
		<div
			className={`space-y-2 ${depth > 0 ? "mt-3 pl-3 border-l-2 border-slate-200" : ""}`}
		>
			<div className="space-y-1">
				{fields.map((field, idx) => (
					<div key={idx} className="rounded-md border bg-white">
						<div
							className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50"
							onClick={() =>
								setExpandedIdx(expandedIdx === idx ? null : idx)
							}
						>
							<div className="flex items-center gap-2 min-w-0">
								{expandedIdx === idx ? (
									<ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
								) : (
									<ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
								)}
								<span className="text-sm font-medium truncate">
									{field.name || "(unnamed)"}
								</span>
								<span className="text-xs text-slate-500 shrink-0">
									{field.type}
								</span>
								{field.required && (
									<span className="text-xs text-red-500 shrink-0">*</span>
								)}
								{propCount(field) != null && (
									<span className="text-xs text-blue-600 shrink-0">
										({propCount(field)} props)
									</span>
								)}
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-red-600 hover:text-red-700 shrink-0"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete(idx);
								}}
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						</div>

						{expandedIdx === idx && (
							<div className="border-t px-3 py-3">
								{renderForm()}
							</div>
						)}
					</div>
				))}
			</div>

			{expandedIdx !== "new" && (
				<Button
					variant="outline"
					size="sm"
					onClick={handleAdd}
					className="gap-1 h-7"
				>
					<Plus className="h-3 w-3" /> Add Property
				</Button>
			)}

			{expandedIdx === "new" && (
				<div className="rounded-md border bg-white px-3 py-3">
					{renderForm()}
				</div>
			)}
		</div>
	);
}
