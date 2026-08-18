import React, { useState } from 'react';
import { toast } from 'sonner';
import { Student, ObservationRecord } from '../../types';
import { Plus, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

interface NewObservationModalProps {
  students: Student[];
  onClose: () => void;
  onSubmit: (obs: ObservationRecord) => void;
}

export const NewObservationModal: React.FC<NewObservationModalProps> = ({
  students,
  onClose,
  onSubmit,
}) => {
  const [studentId, setStudentId] = useState(students[0]?.id || 's1');
  const [source, setSource] = useState<'Teacher' | 'Parent' | 'Counselor'>('Teacher');
  const [concernCategory, setConcernCategory] = useState<
    'Social/Emotional' | 'Academic' | 'Behavioral' | 'Emotional Regulation'
  >('Emotional Regulation');
  const [submitter, setSubmitter] = useState('Sarah Jenkins (Science Teacher)');
  const [setting, setSetting] = useState('Classroom / Science Lab');
  const [narrative, setNarrative] = useState('');
  const [triggers, setTriggers] = useState('');
  const [interventions, setInterventions] = useState('');

  const selectedStudent = students.find((s) => s.id === studentId) || students[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) {
      toast.error('Please enter an observation narrative description.');
      return;
    }

    const newRecord: ObservationRecord = {
      id: `obs-${Date.now()}`,
      recordNumber: `#${Math.floor(800 + Math.random() * 100)}`,
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.name,
      classGroup: `${selectedStudent.classGroup} - ${setting}`,
      source,
      concernCategory,
      date: 'Today',
      incidentTime: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      setting,
      status: 'New',
      submitter,
      narrative,
      triggers: triggers || 'Under evaluation by staff',
      interventions: interventions || 'Monitored by homeroom teacher',
      psychologistNotes: '',
    };

    toast.success('Observation record filed successfully!');
    onSubmit(newRecord);
    onClose();
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
            >
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
          >
            File Observation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
