import React, { useState } from 'react';
import { toast } from 'sonner';
import { ObservationRecord } from '../../types';
import { Plus, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useStudents } from '../../hooks/useStudents';

interface NewObservationModalProps {
  onClose: () => void;
  onSubmitted: (obs: ObservationRecord) => void;
}

export const NewObservationModal: React.FC<NewObservationModalProps> = ({
  onClose,
  onSubmitted,
}) => {
  const { students, loading: studentsLoading } = useStudents();
  const [studentId, setStudentId] = useState<string | number>('');
  const [source, setSource] = useState<'Teacher' | 'Parent' | 'Counselor'>('Teacher');
  const [concernCategory, setConcernCategory] = useState<
    'Social/Emotional' | 'Academic' | 'Behavioral' | 'Emotional Regulation'
  >('Emotional Regulation');
  const [submitter, setSubmitter] = useState('');
  const [setting, setSetting] = useState('Classroom / Science Lab');
  const [narrative, setNarrative] = useState('');
  const [triggers, setTriggers] = useState('');
  const [interventions, setInterventions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStudent =
    students.find((s) => String(s.id) === String(studentId)) || students[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) {
      toast.error('Please enter an observation narrative description.');
      return;
    }
    if (!selectedStudent) {
      toast.error('Please select a student.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/observations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          source,
          category: concernCategory,
          observation: narrative.trim(),
          setting: setting.trim() || null,
          triggers: triggers.trim() || null,
          interventions: interventions.trim() || null,
          submitterName: submitter.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.observation) {
        toast.success('Observation record filed successfully!');
        onSubmitted(data.observation);
        onClose();
      } else {
        toast.error(data.error || 'Failed to file observation record.');
      }
    } catch (err: any) {
      toast.error('Failed to file observation record: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New Observation Record"
      icon={<FileText className="w-5 h-5" />}
      ariaLabelledBy="new-observation-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Select Student" htmlFor="select-student">
            <Select
              id="select-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={studentsLoading}
            >
              {!studentsLoading && students.length === 0 && <option value="">No students available</option>}
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId} - {s.grade})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Observation Source" htmlFor="observation-source">
            <Select
              id="observation-source"
              value={source}
              onChange={(e) => setSource(e.target.value as 'Teacher' | 'Parent' | 'Counselor')}
            >
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
              <option value="Counselor">Counselor</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Concern Category" htmlFor="concern-category">
            <Select
              id="concern-category"
              value={concernCategory}
              onChange={(e) =>
                setConcernCategory(
                  e.target.value as
                    | 'Social/Emotional'
                    | 'Academic'
                    | 'Behavioral'
                    | 'Emotional Regulation'
                )
              }
            >
              <option value="Emotional Regulation">Emotional Regulation</option>
              <option value="Social/Emotional">Social/Emotional</option>
              <option value="Academic">Academic</option>
              <option value="Behavioral">Behavioral</option>
            </Select>
          </FormField>

          <FormField label="Setting / Environment" htmlFor="setting-environment">
            <Input
              id="setting-environment"
              type="text"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="e.g. Science Lab / Playground"
            />
          </FormField>
        </div>

        <FormField label="Observation Narrative Description" htmlFor="observation-narrative" required>
          <Textarea
            id="observation-narrative"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={3}
            placeholder="Detailed description of classroom incident, behaviors observed, emotional state..."
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Antecedent / Triggers" htmlFor="antecedent-triggers">
            <Input
              id="antecedent-triggers"
              type="text"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              placeholder="e.g. Group work with fine motor materials"
            />
          </FormField>

          <FormField label="Intervention Attempted" htmlFor="intervention-attempted">
            <Input
              id="intervention-attempted"
              type="text"
              value={interventions}
              onChange={(e) => setInterventions(e.target.value)}
              placeholder="e.g. Offered quiet break, verbal redirection"
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Filing...' : 'File Observation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};