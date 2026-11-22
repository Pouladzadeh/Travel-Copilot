"use client";

import { forwardRef, useId, type ComponentPropsWithoutRef } from "react";
import { Icon, type IconName } from "./Icon";

/**
 * Field (Figma 8:113): an input with a persistent label.
 * States: Default, Focus (2px focus border), Filled (value in primary text),
 * Error (Booking · form errors 76:173: red border and a message under it).
 */
type FieldProps = Omit<ComponentPropsWithoutRef<"input">, "size"> & {
  label: string;
  icon?: IconName | null;
  error?: string;
  hint?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon = "search", className = "", id, error, hint, ...input },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  return (
    <div className={`flex min-w-0 flex-col gap-4 ${className}`}>
      <label
        htmlFor={inputId}
        className={`bg-surface relative flex min-h-[56px] cursor-text items-center gap-12 rounded-md border px-16 py-8 focus-within:shadow-[inset_0_0_0_1px_var(--color-border-focus)] ${
          error ? "border-[var(--color-text-danger)]" : "border-line-input focus-within:border-line-focus"
        }`}
      >
        {icon && <Icon name={icon} size={20} />}
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-label-s text-fg-secondary">{label}</span>
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? noteId : undefined}
            className="text-body-l text-fg placeholder:text-fg-tertiary w-full min-w-0 bg-transparent outline-none"
            {...input}
          />
        </span>
      </label>
      {error ? (
        <p id={noteId} className="text-body-s text-fg-danger flex items-start gap-4">
          <Icon name="pill-alert-danger" size={14} />
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-body-s text-fg-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
