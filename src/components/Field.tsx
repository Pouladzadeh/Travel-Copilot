"use client";

import { useId, type ComponentPropsWithoutRef } from "react";
import { Icon, type IconName } from "./Icon";

/**
 * Field (Figma 8:113): a search input with a persistent label.
 * States: Default, Focus (2px focus border), Filled (value in primary text).
 */
type FieldProps = Omit<ComponentPropsWithoutRef<"input">, "size"> & {
  label: string;
  icon?: IconName | null;
};

export function Field({ label, icon = "search", className = "", id, ...input }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={`border-line-input bg-surface focus-within:border-line-focus relative flex min-h-[56px] cursor-text items-center gap-12 rounded-md border px-16 py-8 focus-within:shadow-[inset_0_0_0_1px_var(--color-border-focus)] ${className}`}
    >
      {icon && <Icon name={icon} size={20} />}
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-label-s text-fg-secondary">{label}</span>
        <input
          id={inputId}
          className="text-body-l text-fg placeholder:text-fg-tertiary w-full min-w-0 bg-transparent outline-none"
          {...input}
        />
      </span>
    </label>
  );
}
