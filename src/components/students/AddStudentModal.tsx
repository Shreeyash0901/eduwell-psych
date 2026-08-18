import React, { useState } from 'react';
import { toast } from 'sonner';
import { Student, WellnessStatus, IepStatus } from '../../types';
import { UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface AddStudentModalProps {
  onClose: () => void;
  onAddStudent: (newStudent: Student) => void;
}

interface FormErrors {
  studentId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  grade?: string;
  classGroup?: string;
  homeroom?: string;
  guardianName?: string;
  guardianContact?: string;
  iepStatus?: string;
  status?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  onClose,
  onAddStudent,
}) => {
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [grade, setGrade] = useState('Grade 8');
  const [classGroup, setClassGroup] = useState('8A');
  const [homeroom, setHomeroom] = useState('Homeroom 8A');
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [iepStatus, setIepStatus] = useState<IepStatus>('No IEP');
  const [status, setStatus] = useState<WellnessStatus>('Normal');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateAge = (dob: string): number => {
    if (!dob) return 12;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) || age < 3 ? 12 : age;
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!studentId.trim()) {
      newErrors.studentId = 'Student ID is required (e.g. STU-10492).';
    }
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required.';
    } else {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
        newErrors.dateOfBirth = 'Please enter a valid past birth date.';
      }
    }
    if (!grade.trim()) {
      newErrors.grade = 'Grade level is required.';
    }
    if (!classGroup.trim()) {
      newErrors.classGroup = 'Class/Section is required.';
    }
    if (!homeroom.trim()) {
      newErrors.homeroom = 'Homeroom is required.';
    }
    if (!guardianName.trim()) {
      newErrors.guardianName = 'Guardian name is required.';
    }
    if (!guardianContact.trim()) {
      newErrors.guardianContact = 'Guardian contact is required (phone or email).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the required fields before submitting.');
      return;
    }

    setIsSubmitting(true);

    const calculatedAge = calculateAge(dateOfBirth);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const newStudent: Student = {
      id: `s-${Date.now()}`,
      studentId: studentId.trim(),
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      grade: grade.trim(),
      classGroup: classGroup.trim(),
      age: calculatedAge,
      homeroom: homeroom.trim(),
      guardianName: guardianName.trim(),
      guardianContact: guardianContact.trim(),
      iepStatus,
      priorObsCount: 0,
      status,
      primaryDomainFlag:
        status === 'Attention Required'
          ? 'Attention Required (Initial Assessment Needed)'
          : status === 'Monitor'
          ? 'Observation Required'
          : 'Baseline Optimal',
      scoreFlag: status === 'Attention Required' ? 3.5 : status === 'Monitor' ? 5.5 : 8.0,
      avatarUrl: `https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200`,
      domainScores: {
        emotionalRegulation: status === 'Normal' ? 7.8 : status === 'Monitor' ? 5.8 : 4.0,
        socialInteraction: status === 'Normal' ? 8.2 : status === 'Monitor' ? 6.2 : 4.5,
        academicAnxiety: status === 'Normal' ? 3.2 : status === 'Monitor' ? 5.5 : 7.5,
        focusAttention: status === 'Normal' ? 7.9 : status === 'Monitor' ? 5.2 : 3.8,
        selfConfidence: status === 'Normal' ? 8.0 : status === 'Monitor' ? 6.0 : 4.5,
        schoolAdjustment: status === 'Normal' ? 8.5 : status === 'Monitor' ? 6.5 : 5.0,
      },
    };

    toast.success('Student added to roster successfully!');
    onAddStudent(newStudent);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add New Student"
      description="Enroll a new student into the psychologist and district wellness tracking directory."
      icon={<UserPlus className="w-5 h-5" />}
      ariaLabelledBy="add-student-title"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
        {/* Row 1: Student ID & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Student ID" htmlFor="studentId" required error={errors.studentId}>
            <Input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: undefined }));
              }}
              placeholder="e.g. STU-10492"
              hasError={!!errors.studentId}
            />
          </FormField>

          <FormField label="Date of Birth" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
              }}
              hasError={!!errors.dateOfBirth}
            />
          </FormField>
        </div>

        {/* Row 2: First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="First Name" htmlFor="firstName" required error={errors.firstName}>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
              }}
              placeholder="e.g. Liam"
              hasError={!!errors.firstName}
            />
          </FormField>

          <FormField label="Last Name" htmlFor="lastName" required error={errors.lastName}>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
              }}
              placeholder="e.g. Miller"
              hasError={!!errors.lastName}
            />
          </FormField>
        </div>

        {/* Row 3: Grade, Class/Section & Homeroom */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Grade" htmlFor="grade" required error={errors.grade}>
            <Input
              id="grade"
              type="text"
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                if (errors.grade) setErrors((prev) => ({ ...prev, grade: undefined }));
              }}
              placeholder="e.g. Grade 8"
              hasError={!!errors.grade}
            />
          </FormField>

          <FormField label="Class / Section" htmlFor="classGroup" required error={errors.classGroup}>
            <Input
              id="classGroup"
              type="text"
              value={classGroup}
              onChange={(e) => {
                setClassGroup(e.target.value);
                if (errors.classGroup) setErrors((prev) => ({ ...prev, classGroup: undefined }));
              }}
              placeholder="e.g. 8A or Section B"
              hasError={!!errors.classGroup}
            />
          </FormField>

          <FormField label="Homeroom" htmlFor="homeroom" required error={errors.homeroom}>
            <Input
              id="homeroom"
              type="text"
              value={homeroom}
              onChange={(e) => {
                setHomeroom(e.target.value);
                if (errors.homeroom) setErrors((prev) => ({ ...prev, homeroom: undefined }));
              }}
              placeholder="e.g. Homeroom 8A"
              hasError={!!errors.homeroom}
            />
          </FormField>
        </div>

        {/* Row 4: Guardian Name & Guardian Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Guardian Name" htmlFor="guardianName" required error={errors.guardianName}>
            <Input
              id="guardianName"
              type="text"
              value={guardianName}
              onChange={(e) => {
                setGuardianName(e.target.value);
                if (errors.guardianName) setErrors((prev) => ({ ...prev, guardianName: undefined }));
              }}
              placeholder="e.g. Robert & Helen Miller"
              hasError={!!errors.guardianName}
            />
          </FormField>

          <FormField label="Guardian Contact (Phone / Email)" htmlFor="guardianContact" required error={errors.guardianContact}>
            <Input
              id="guardianContact"
              type="text"
              value={guardianContact}
              onChange={(e) => {
                setGuardianContact(e.target.value);
                if (errors.guardianContact) setErrors((prev) => ({ ...prev, guardianContact: undefined }));
              }}
              placeholder="e.g. (555) 019-2834 or parent@mail.com"
              hasError={!!errors.guardianContact}
            />
          </FormField>
        </div>

        {/* Row 5: IEP Status & Initial Wellness Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="IEP Status" htmlFor="iepStatus" required>
            <Select
              id="iepStatus"
              value={iepStatus}
              onChange={(e) => setIepStatus(e.target.value as IepStatus)}
            >
              <option value="No IEP">No IEP</option>
              <option value="IEP Active">IEP Active</option>
              <option value="504 Plan Active">504 Plan Active</option>
              <option value="Under Evaluation">Under Evaluation</option>
            </Select>
          </FormField>

          <FormField label="Initial Wellness Status (Default: Normal)" htmlFor="initialWellnessStatus" required>
            <Select
              id="initialWellnessStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as WellnessStatus)}
            >
              <option value="Normal">Normal</option>
              <option value="Monitor">Monitor</option>
              <option value="Attention Required">Attention Required</option>
            </Select>
          </FormField>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Student to Roster
          </Button>
        </div>
      </form>
    </Modal>
  );
};
