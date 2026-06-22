"use client";

import React from "react";

const CLS_INPUT = [
  "w-full px-3.5 py-2.5 rounded-lg text-sm transition",
  "bg-surface-card border border-surface-mist-strong",
  "text-text-primary placeholder:text-text-muted",
  "focus:outline-none focus:border-brand-primary focus:ring-[3px] focus:ring-brand-primary/20",
].join(" ");

export interface TemplateField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  optional?: boolean;
}

interface Props {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
  lang: "FR" | "PT";
}

export function FieldInput({ field, value, onChange, lang }: Props) {
  const placeholder = lang === "FR" ? `Saisir ${field.label.toLowerCase()}…` : `Inserir ${field.label.toLowerCase()}…`;

  if (field.type === "date") {
    return (
      <input
        type="date"
        aria-label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={CLS_INPUT}
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        aria-label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={CLS_INPUT}
      />
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <select
        aria-label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={CLS_INPUT}
      >
        <option value="">
          {lang === "FR" ? "— Sélectionner —" : "— Selecionar —"}
        </option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        aria-label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className={`${CLS_INPUT} resize-none`}
      />
    );
  }

  return (
    <input
      type="text"
      aria-label={field.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={CLS_INPUT}
    />
  );
}
