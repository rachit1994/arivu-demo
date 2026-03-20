import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title: string;
}

export const PanelFrame = ({ children, title }: Props) => {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200">
        {title}
      </div>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  );
};

