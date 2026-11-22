import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Button (Figma 8:88). Primary for the one main action on a screen,
 * Secondary for alternatives, Ghost for low-emphasis actions. 44px high.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-md px-20 py-12 text-label-m transition-colors disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-fg-on-brand hover:bg-brand-hover disabled:bg-subtle disabled:text-fg-tertiary",
  secondary:
    "border border-line-strong bg-surface text-fg hover:bg-subtle disabled:border-line disabled:bg-surface disabled:text-fg-tertiary",
  ghost:
    "text-fg-link hover:bg-brand-subtle disabled:bg-transparent disabled:text-fg-tertiary",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
};

export function ButtonLink({ variant = "primary", className = "", ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, className)} {...rest} />;
}
