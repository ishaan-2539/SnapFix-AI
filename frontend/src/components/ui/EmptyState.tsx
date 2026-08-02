import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-brand-600" strokeWidth={1.75} />
      </div>
      <h3 className="font-display font-bold text-lg text-ink-900">{title}</h3>
      <p className="text-ink-500 text-sm mt-1.5 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
