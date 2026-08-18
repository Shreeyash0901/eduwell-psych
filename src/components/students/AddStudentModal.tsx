import React, { useState } from 'react';
import { Student, WellnessStatus, IepStatus } from '../../types';
import { X, UserPlus, AlertCircle } from 'lucide-react';

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
    if (!validate()) return;

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

    onAddStudent(newStudent);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 my-8 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-student-title" className="text-xl font-bold text-slate-900 tracking-tight">
                Add New Student
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enroll a new student into the psychologist and district wellness tracking directory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Enrollment Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
          {/* Row 1: Student ID & Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentId" className="block font-bold text-slate-700 mb-1">
                Student ID <span className="text-rose-500">*</span>
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: undefined }));
                }}
                placeholder="e.g. STU-10492"
                aria-invalid={!!errors.studentId}
                aria-describedby={errors.studentId ? 'studentId-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.studentId ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.studentId && (
                <p id="studentId-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.studentId}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block font-bold text-slate-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                }}
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'dob-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.dateOfBirth ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.dateOfBirth && (
                <p id="dob-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.dateOfBirth}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block font-bold text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                placeholder="e.g. Liam"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.firstName ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.firstName && (
                <p id="firstName-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.firstName}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block font-bold text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                placeholder="e.g. Miller"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.lastName ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.lastName && (
                <p id="lastName-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.lastName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Grade, Class/Section & Homeroom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="grade" className="block font-bold text-slate-700 mb-1">
                Grade <span className="text-rose-500">*</span>
              </label>
              <input
                id="grade"
                type="text"
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  if (errors.grade) setErrors((prev) => ({ ...prev, grade: undefined }));
                }}
                placeholder="e.g. Grade 8"
                aria-invalid={!!errors.grade}
                aria-describedby={errors.grade ? 'grade-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.grade ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.grade && (
                <p id="grade-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.grade}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="classGroup" className="block font-bold text-slate-700 mb-1">
                Class / Section <span className="text-rose-500">*</span>
              </label>
              <input
                id="classGroup"
                type="text"
                value={classGroup}
                onChange={(e) => {
                  setClassGroup(e.target.value);
                  if (errors.classGroup) setErrors((prev) => ({ ...prev, classGroup: undefined }));
                }}
                placeholder="e.g. 8A or Section B"
                aria-invalid={!!errors.classGroup}
                aria-describedby={errors.classGroup ? 'classGroup-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.classGroup ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.classGroup && (
                <p id="classGroup-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.classGroup}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="homeroom" className="block font-bold text-slate-700 mb-1">
                Homeroom <span className="text-rose-500">*</span>
              </label>
              <input
                id="homeroom"
                type="text"
                value={homeroom}
                onChange={(e) => {
                  setHomeroom(e.target.value);
                  if (errors.homeroom) setErrors((prev) => ({ ...prev, homeroom: undefined }));
                }}
                placeholder="e.g. Homeroom 8A"
                aria-invalid={!!errors.homeroom}
                aria-describedby={errors.homeroom ? 'homeroom-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.homeroom ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.homeroom && (
                <p id="homeroom-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.homeroom}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Guardian Name & Guardian Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guardianName" className="block font-bold text-slate-700 mb-1">
                Guardian Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="guardianName"
                type="text"
                value={guardianName}
                onChange={(e) => {
                  setGuardianName(e.target.value);
                  if (errors.guardianName) setErrors((prev) => ({ ...prev, guardianName: undefined }));
                }}
                placeholder="e.g. Robert & Helen Miller"
                aria-invalid={!!errors.guardianName}
                aria-describedby={errors.guardianName ? 'guardianName-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.guardianName ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.guardianName && (
                <p id="guardianName-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.guardianName}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="guardianContact" className="block font-bold text-slate-700 mb-1">
                Guardian Contact (Phone / Email) <span className="text-rose-500">*</span>
              </label>
              <input
                id="guardianContact"
                type="text"
                value={guardianContact}
                onChange={(e) => {
                  setGuardianContact(e.target.value);
                  if (errors.guardianContact) setErrors((prev) => ({ ...prev, guardianContact: undefined }));
                }}
                placeholder="e.g. (555) 019-2834 or parent@mail.com"
                aria-invalid={!!errors.guardianContact}
                aria-describedby={errors.guardianContact ? 'guardianContact-error' : undefined}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.guardianContact ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.guardianContact && (
                <p id="guardianContact-error" className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.guardianContact}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 5: IEP Status & Initial Wellness Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="iepStatus" className="block font-bold text-slate-700 mb-1">
                IEP Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="iepStatus"
                value={iepStatus}
                onChange={(e) => setIepStatus(e.target.value as IepStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="No IEP">No IEP</option>
                <option value="IEP Active">IEP Active</option>
                <option value="504 Plan Active">504 Plan Active</option>
                <option value="Under Evaluation">Under Evaluation</option>
              </select>
            </div>

            <div>
              <label htmlFor="initialWellnessStatus" className="block font-bold text-slate-700 mb-1">
                Initial Wellness Status (Default: Normal) <span className="text-rose-500">*</span>
              </label>
              <select
                id="initialWellnessStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as WellnessStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="Normal">Normal</option>
                <option value="Monitor">Monitor</option>
                <option value="Attention Required">Attention Required</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-70"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student to Roster</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
