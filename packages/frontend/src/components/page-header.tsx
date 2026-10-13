import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {description !== undefined && (
          <p className="max-w-[62ch] text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
