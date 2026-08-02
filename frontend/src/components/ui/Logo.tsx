import { cn } from "@/lib/utils";

/**
 * SnapFix AI mark: a location pin whose body is cut by a road line, with the
 * pin's point resolving into a checkmark — "an issue, located and resolved."
 * Flat, single-color, no mascot.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("w-8 h-8", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 3C12.8 3 7 8.8 7 16c0 9.5 11.5 20 12 20.4a1.5 1.5 0 0 0 2 0C21.5 36 33 25.5 33 16 33 8.8 27.2 3 20 3Z"
        fill="currentColor"
      />
      <path
        d="M13.5 17.2 17.8 21.5 27 12"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, wordmarkClassName }: { className?: string; wordmarkClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="text-brand-600" />
      <span className={cn("font-display font-extrabold text-lg text-ink-900 tracking-tight", wordmarkClassName)}>
        SnapFix <span className="text-brand-600">AI</span>
      </span>
    </div>
  );
}
