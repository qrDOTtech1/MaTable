"use client";

import { ReactNode, useEffect } from "react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: {
    primary?: {
      label: string;
      onClick: () => void;
      loading?: boolean;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  size?: "sm" | "md" | "lg";
  danger?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  danger = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-md",
    lg: "w-full max-w-lg",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${sizeClasses[size]} rounded-xl border border-white/[0.06] bg-[#111] shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
            {footer.secondary && (
              <Button variant="secondary" size="sm" onClick={footer.secondary.onClick}>
                {footer.secondary.label}
              </Button>
            )}
            {footer.primary && (
              <Button
                variant={danger ? "danger" : "primary"}
                size="sm"
                onClick={footer.primary.onClick}
                disabled={footer.primary.loading}
              >
                {footer.primary.loading ? "Loading..." : footer.primary.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
