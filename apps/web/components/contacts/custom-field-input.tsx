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

export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps) {
  if (field.field_type === "text" || field.field_type === "number") {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{field.name}</Label>
        <Input
          type={field.field_type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
        />
      </div>
    );
  }

  if (field.field_type === "date") {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{field.name}</Label>
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.field_type === "select") {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{field.name}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Selecione ${field.name}`} />
          </SelectTrigger>
          <SelectContent>
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
        />
        <Label htmlFor={field.id} className="text-xs">
          {field.name}
        </Label>
      </div>
    );
  }

  return null;
}
