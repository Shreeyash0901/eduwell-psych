import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { Save, ShieldCheck, Sparkles, Sliders } from 'lucide-react';

interface SettingsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const [districtName, setDistrictName] = useState('Metropolitan Unified School District');
  const [termName, setTermName] = useState('Fall Term 2024');
  const [attentionThreshold, setAttentionThreshold] = useState(5.0);
  const [aiEnabled, setAiEnabled] = useState(true);

  const handleSave = () => {
    alert('Settings saved successfully.');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suite Settings</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Configure EduWell Psych district parameters, scoring metrics, and AI assistant behavior.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-blue-700 font-bold text-sm">
          <Sliders className="w-4 h-4" />
          <span>District & Academic Year Parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">School District Name</label>
            <input
              type="text"
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Active Evaluation Term</label>
            <input
              type="text"
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Attention Required Threshold (Max Score: 10)</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Scores below this mean value trigger automated priority review badges.
            </p>
          </div>
          <input
            type="number"
            step="0.5"
            value={attentionThreshold}
            onChange={(e) => setAttentionThreshold(parseFloat(e.target.value))}
            className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-center text-slate-900"
          />
        </div>

        {/* AI Assistant Config */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Server-Side Gemini AI Clinical Assistant
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Automatically generate psychological narrative hypotheses and IEP summaries.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                aiEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
            </button>
          </div>

          <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl text-xs text-slate-700 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              Your Gemini API Key is stored securely on the server via the AI Studio Secrets Manager.
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Suite Settings
          </button>
        </div>
      </div>
    </div>
  );
};
