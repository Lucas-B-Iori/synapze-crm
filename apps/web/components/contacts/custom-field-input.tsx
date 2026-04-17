"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CustomFieldDefinition } from "@/types/contact";

interface CustomFieldInputProps {
  field: CustomFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}

const inputClass =
  "border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40";

export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps) {
  if (field.field_type === "text" || field.field_type === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">{field.name}</Label>
        <Input
          type={field.field_type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
          className={inputClass}
        />
      </div>
    );
  }

  if (field.field_type === "date") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">{field.name}</Label>
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
    );
  }

  if (field.field_type === "select") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">{field.name}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={`Selecione ${field.name}`} />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={field.id}
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          className="border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
        />
        <Label htmlFor={field.id} className="text-xs text-zinc-400">
          {field.name}
        </Label>
      </div>
    );
  }

  return null;
}
