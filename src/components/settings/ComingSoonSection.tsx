import React from 'react';
import { Hourglass } from 'lucide-react';
import { SectionCard } from './SectionState';

interface ComingSoonSectionProps {
  title: string;
  subtitle?: string;
  items: { name: string; description: string }[];
}

export const ComingSoonSection: React.FC<ComingSoonSectionProps> = ({ title, subtitle, items }) => (
  <SectionCard
    title={title}
    subtitle={subtitle}
    actions={
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
        <Hourglass className="w-3.5 h-3.5" />
        Coming Soon
      </span>
    }
  >
    <div className="space-y-4">
      <p className="text-xs text-slate-500 font-medium">
        This section requires backend infrastructure that is not yet available. It is displayed for
        planning purposes only and cannot be modified.
      </p>
      {items.map((item) => (
        <div key={item.name} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 opacity-70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
          </div>
          <span className="shrink-0 px-2.5 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-md">
            Unavailable
          </span>
        </div>
      ))}
    </div>
  </SectionCard>
);