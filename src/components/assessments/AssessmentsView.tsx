import React, { useState } from 'react';
import { AssessmentProtocol, ActiveTab } from '../../types';
import { Smile, Brain, Target, Play, Plus, Sliders } from 'lucide-react';
import { TemplateBuilderModal } from './TemplateBuilderModal';

interface AssessmentsViewProps {
  protocols: AssessmentProtocol[];
  onStartProtocol: (protocol: AssessmentProtocol) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onRefreshProtocols?: () => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({
  protocols,
  onStartProtocol,
  setActiveTab,
  onRefreshProtocols,
}) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const getProtocolIcon = (id: string) => {
    switch (id) {
      case 'p1':
        return <Smile className="w-5 h-5 text-blue-600" />;
      case 'p2':
        return <Brain className="w-5 h-5 text-blue-600" />;
      case 'p3':
        return <Target className="w-5 h-5 text-blue-600" />;
      default:
        return <Smile className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment Library</h1>
          <p className="text-sm text-slate-500 font-medium mt-1 max-w-3xl">
            Conduct structured student assessments and review results. Select an assessment protocol below to begin a new session.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Protocol</span>
          </button>

          <button
            onClick={() => setActiveTab('psychologist_interpretation')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Brain className="w-4 h-4 text-indigo-600" />
            <span>Clinical Interpretation</span>
          </button>
        </div>
      </div>

      {/* Protocol Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {protocols.map((protocol) => (
          <div
            key={protocol.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300"
          >
            <div className="space-y-5">
              {/* Icon & Title */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl shrink-0">
                  {getProtocolIcon(protocol.id)}
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-snug mt-0.5">
                  {protocol.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {protocol.description}
              </p>

              {/* Protocol Metadata Box */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-xl p-4 space-y-3 border border-slate-200/60">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-600 font-semibold text-xs leading-tight">Domain:</span>
                  <span className="text-slate-900 font-medium text-xs text-right leading-tight">
                    {protocol.domains.join(', ')}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-600 font-semibold text-xs leading-tight">Questions</span>
                  <span className="text-slate-900 font-semibold text-xs text-right">{protocol.questionCount} Items</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-600 font-semibold text-xs leading-tight">Est. Time</span>
                  <span className="text-slate-900 font-semibold text-xs text-right">{protocol.estTime}</span>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-6">
              <button
                onClick={() => onStartProtocol(protocol)}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Assessment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Assessment Template Builder Modal */}
      <TemplateBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onTemplateCreated={onRefreshProtocols}
      />
    </div>
  );
};
