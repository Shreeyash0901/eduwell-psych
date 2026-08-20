import React, { useEffect, useState, useCallback } from 'react';
import {
  GraduationCap, Plus, Trash2, RefreshCw, Pencil, Check, X,
  ChevronDown, ChevronRight, LayoutGrid, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SectionLoading, SectionError, SectionCard } from './SectionState';

interface SectionRecord {
  id: number;
  name: string;
  isActive: boolean;
}

interface ClassRecord {
  id: number;
  name: string;
  isActive: boolean;
  displayOrder: number;
  sections: SectionRecord[];
}

type InlineError = { classId?: number; msg: string } | null;

export const ClassesSectionsSection: React.FC = () => {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<InlineError>(null);

  // ── Add class ──────────────────────────────────────────────
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);

  // ── Rename class ───────────────────────────────────────────
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [isSavingClass, setIsSavingClass] = useState(false);

  // ── Add section ────────────────────────────────────────────
  const [addingSectionForClass, setAddingSectionForClass] = useState<number | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  // ── Expanded state ─────────────────────────────────────────
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/settings/classes', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load classes.');
      setClasses(data.classes);
      // auto-expand all
      setExpanded(new Set(data.classes.map((c: ClassRecord) => c.id)));
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Helpers ────────────────────────────────────────────────
  function clearInlineError() { setInlineError(null); }

  async function addClass() {
    const name = newClassName.trim();
    if (!name) return;
    setIsAddingClass(true);
    clearInlineError();
    try {
      const res = await fetch('/api/settings/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create class.');
      setClasses((prev) => [...prev, { ...data.class, sections: [] }]);
      setExpanded((prev) => new Set([...prev, data.class.id]));
      setNewClassName('');
      setShowAddClass(false);
    } catch (err: any) {
      setInlineError({ msg: err.message });
    } finally {
      setIsAddingClass(false);
    }
  }

  async function saveRename(classId: number) {
    const name = editClassName.trim();
    if (!name) return;
    setIsSavingClass(true);
    clearInlineError();
    try {
      const res = await fetch(`/api/settings/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to rename class.');
      setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, name: data.class.name } : c)));
      setEditingClassId(null);
    } catch (err: any) {
      setInlineError({ classId, msg: err.message });
    } finally {
      setIsSavingClass(false);
    }
  }

  async function deleteClass(cls: ClassRecord) {
    if (!window.confirm(`Delete "${cls.name}"? This cannot be undone.`)) return;
    clearInlineError();
    try {
      const res = await fetch(`/api/settings/classes/${cls.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete class.');
      setClasses((prev) => prev.filter((c) => c.id !== cls.id));
    } catch (err: any) {
      setInlineError({ classId: cls.id, msg: err.message });
    }
  }

  async function addSection(classId: number) {
    const name = newSectionName.trim();
    if (!name) return;
    setIsAddingSection(true);
    clearInlineError();
    try {
      const res = await fetch(`/api/settings/classes/${classId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add section.');
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId ? { ...c, sections: [...c.sections, data.section].sort((a, b) => a.name.localeCompare(b.name)) } : c
        )
      );
      setNewSectionName('');
      setAddingSectionForClass(null);
    } catch (err: any) {
      setInlineError({ classId, msg: err.message });
    } finally {
      setIsAddingSection(false);
    }
  }

  async function deleteSection(classId: number, section: SectionRecord) {
    clearInlineError();
    try {
      const res = await fetch(`/api/settings/classes/${classId}/sections/${section.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove section.');
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId ? { ...c, sections: c.sections.filter((s) => s.id !== section.id) } : c
        )
      );
    } catch (err: any) {
      setInlineError({ classId, msg: err.message });
    }
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (isLoading) return <SectionCard title="Classes & Sections"><SectionLoading label="Loading classes..." /></SectionCard>;
  if (loadError) return <SectionCard title="Classes & Sections"><SectionError message={loadError} onRetry={load} /></SectionCard>;

  return (
    <SectionCard
      title="Classes & Sections"
      subtitle="Manage grade levels and their sections. Students can be assigned to these classes and sections during enrollment."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => { setShowAddClass(true); setInlineError(null); }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Grade
          </Button>
        </div>
      }
    >
      {/* Add Grade inline form */}
      {showAddClass && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-2">
          <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            autoFocus
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addClass(); if (e.key === 'Escape') { setShowAddClass(false); setNewClassName(''); } }}
            placeholder="e.g. Grade 11"
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
          />
          <button
            onClick={addClass}
            disabled={isAddingClass || !newClassName.trim()}
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            title="Add grade"
          >
            {isAddingClass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { setShowAddClass(false); setNewClassName(''); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global inline error (not tied to a class) */}
      {inlineError && !inlineError.classId && (
        <div className="flex items-start gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {inlineError.msg}
        </div>
      )}

      {classes.length === 0 && !showAddClass && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LayoutGrid className="w-10 h-10 text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-700">No classes yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Click <span className="font-semibold text-blue-600">Add Grade</span> to create your first grade level.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {classes.map((cls) => {
          const isOpen = expanded.has(cls.id);
          const isEditing = editingClassId === cls.id;
          const classError = inlineError?.classId === cls.id ? inlineError.msg : null;

          return (
            <div
              key={cls.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
            >
              {/* Class header row */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <button
                  onClick={() => toggleExpand(cls.id)}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                  title={isOpen ? 'Collapse' : 'Expand'}
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />

                {isEditing ? (
                  <input
                    autoFocus
                    type="text"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(cls.id);
                      if (e.key === 'Escape') setEditingClassId(null);
                    }}
                    className="flex-1 text-sm font-semibold text-slate-900 bg-white border border-blue-300 rounded-md px-2 py-0.5 outline-none"
                  />
                ) : (
                  <span className="flex-1 text-sm font-semibold text-slate-900">{cls.name}</span>
                )}

                <span className="text-[11px] font-medium text-slate-400 mr-2">
                  {cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}
                </span>

                {isEditing ? (
                  <>
                    <button
                      onClick={() => saveRename(cls.id)}
                      disabled={isSavingClass}
                      className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      title="Save"
                    >
                      {isSavingClass ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setEditingClassId(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingClassId(cls.id); setEditClassName(cls.name); clearInlineError(); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Rename class"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteClass(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Class body: sections */}
              {isOpen && (
                <div className="px-4 py-3 space-y-2">
                  {/* Error for this class */}
                  {classError && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {classError}
                    </div>
                  )}

                  {/* Section chips */}
                  <div className="flex flex-wrap gap-2">
                    {cls.sections.length === 0 && addingSectionForClass !== cls.id && (
                      <p className="text-xs text-slate-400 italic">No sections yet — add one below.</p>
                    )}
                    {cls.sections.map((sec) => (
                      <span
                        key={sec.id}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all"
                      >
                        {sec.name}
                        <button
                          onClick={() => deleteSection(cls.id, sec)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all"
                          title={`Remove section ${sec.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add section inline */}
                  {addingSectionForClass === cls.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        autoFocus
                        type="text"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addSection(cls.id);
                          if (e.key === 'Escape') { setAddingSectionForClass(null); setNewSectionName(''); }
                        }}
                        placeholder="e.g. Section A"
                        className="flex-1 text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 bg-white text-slate-800 placeholder-slate-400"
                      />
                      <button
                        onClick={() => addSection(cls.id)}
                        disabled={isAddingSection || !newSectionName.trim()}
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        title="Add section"
                      >
                        {isAddingSection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => { setAddingSectionForClass(null); setNewSectionName(''); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingSectionForClass(cls.id); setNewSectionName(''); clearInlineError(); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg px-2 py-1 mt-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Section
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};