"use client";

import type { ReactNode } from "react";

export function ConfirmSubmitButton({
  label,
  confirmMessage,
  className,
  children,
}: {
  label?: string;
  confirmMessage: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children ?? label}
    </button>
  );
}
