import React, { useEffect, useState, useCallback } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { SectionLoading, SectionError, SectionEmpty, SectionCard } from './SectionState';

interface ClassRecord {
  id: number;
  name: string;
}

interface SectionRecord {
  id: number;
  name: string;
  classId: number;
}

interface AcademicSessionRecord {
  id: number;
  name: string;
  isCurrent: boolean;
}

export const ClassesSectionsSection: React.FC = () => {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLookups = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/lookups/student-filters', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load classes and sections.');
      }
      setClasses(data.classes || []);
      setSections(data.sections || []);
      setSessions(data.academicSessions || []);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load classes and sections.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  if (isLoading) {
    return <SectionCard title="Classes & Sections"><SectionLoading label="Loading classes and sections..." /></SectionCard>;
  }

  if (loadError) {
    return (
      <SectionCard title="Classes & Sections">
        <SectionError message={loadError} onRetry={loadLookups} />
      </SectionCard>
    );
  }

  const grouped = classes
    .map((cls) => ({
      ...cls,
      sectionList: sections.filter((s) => s.classId === cls.id),
    }))
    .filter((cls) => cls.sectionList.length > 0);

  return (
    <SectionCard
      title="Classes & Sections"
      subtitle="Real class and section records for your school, sourced from the lookups API. Class management is handled through external School API synchronization."
      actions={
        <Button type="button" variant="secondary" size="sm" onClick={loadLookups}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      }
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3">
        <Layers className="w-4 h-4 text-slate-400" />
        {sessions.find((s) => s.isCurrent)?.name || 'No active academic session'} · {grouped.length} class{grouped.length === 1 ? '' : 'es'}
      </div>

      {grouped.length === 0 ? (
        <SectionEmpty
          title="No classes with sections"
          message="No active class/section records were found for this school."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grouped.map((cls) => (
            <div key={cls.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-900">{cls.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cls.sectionList.map((sec) => (
                  <span key={sec.id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-600">
                    {sec.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};