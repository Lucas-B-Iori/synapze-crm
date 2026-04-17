"use client";

import { getAvatarColor, getInitials } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";

interface AvatarFallbackProps {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function AvatarFallback({ name, size = "md", className }: AvatarFallbackProps) {
  const { bg, text } = getAvatarColor(name || "");
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold tracking-tight",
        sizeClasses[size],
        bg,
        text,
        className
      )}
      aria-label={name || "Avatar"}
    >
      {getInitials(name)}
    </div>
  );
}
