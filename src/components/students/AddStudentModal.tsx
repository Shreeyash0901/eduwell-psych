import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Student, StudentFilterLookups } from '../../types';
import { UserPlus, AlertCircle } from 'lucide-react';
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
  gender?: string;
  classId?: string;
  sectionId?: string;
  email?: string;
  phone?: string;
  admissionNo?: string;
  registrationNo?: string;
  general?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  onClose,
  onAddStudent,
}) => {
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [classId, setClassId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [lookups, setLookups] = useState<StudentFilterLookups>({
    classes: [],
    sections: [],
    academicSessions: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch classes and sections on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLookups() {
      try {
        const res = await fetch('/api/lookups/student-filters', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setLookups({
              classes: data.classes || [],
              sections: data.sections || [],
              academicSessions: data.academicSessions || [],
            });

            // Set default selected class & section if available
            if (data.classes && data.classes.length > 0) {
              const firstClassId = String(data.classes[0].id);
              setClassId(firstClassId);
              const matchingSections = (data.sections || []).filter(
                (sec: any) => String(sec.classId) === firstClassId
              );
              if (matchingSections.length > 0) {
                setSectionId(String(matchingSections[0].id));
              }
            }
          }
        }
      } catch (err) {
        console.error('[ADD_STUDENT_MODAL] Lookup loading failed:', err);
      }
    }

    loadLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const matchingSections = lookups.sections.filter(
      (sec) => String(sec.classId) === newClassId
    );
    if (matchingSections.length > 0) {
      setSectionId(String(matchingSections[0].id));
    } else {
      setSectionId('');
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

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
    if (!gender) {
      newErrors.gender = 'Gender is required.';
    }
    if (!classId) {
      newErrors.classId = 'Please select an academic class.';
    }
    if (!sectionId) {
      newErrors.sectionId = 'Please select a class section.';
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address format.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      toast.error('Please resolve the required fields before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        studentId: studentId.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        dateOfBirth,
        gender,
        classId: classId ? parseInt(classId, 10) : undefined,
        sectionId: sectionId ? parseInt(sectionId, 10) : undefined,
        admissionNo: admissionNo.trim() || undefined,
        registrationNo: registrationNo.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 201 && data.success && data.student) {
        toast.success(`Student ${data.student.fullName || data.student.name} enrolled successfully!`);
        onAddStudent(data.student);
        onClose();
      } else {
        const errorMsg = data.error || `Server responded with status ${res.status}`;
        setErrors({ general: errorMsg });
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('[ADD_STUDENT_MODAL] Submission error:', err);
      const networkError = err.message || 'Network error occurred while enrolling student.';
      setErrors({ general: networkError });
      toast.error(networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSections = lookups.sections.filter(
    (sec) => String(sec.classId) === classId
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add New Student"
      description="Enroll a new student into the PostgreSQL psychologist and school wellness tracking database."
      icon={<UserPlus className="w-5 h-5" />}
      ariaLabelledBy="add-student-title"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
        {/* General Error Banner */}
        {errors.general && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errors.general}</span>
          </div>
        )}

        {/* Row 1: Student ID & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Student ID (Optional - Auto generated if empty)"
            htmlFor="studentId"
            error={errors.studentId}
          >
            <Input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: undefined }));
              }}
              placeholder="e.g. STU-1004"
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
              placeholder="e.g. Vance"
              hasError={!!errors.lastName}
            />
          </FormField>
        </div>

        {/* Row 3: Gender, Class & Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Gender" htmlFor="gender" required error={errors.gender}>
            <Select
              id="gender"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                if (errors.gender) setErrors((prev) => ({ ...prev, gender: undefined }));
              }}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Other">Other</option>
            </Select>
          </FormField>

          <FormField label="Academic Class" htmlFor="classId" required error={errors.classId}>
            <Select
              id="classId"
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
            >
              {lookups.classes.length === 0 && <option value="">Loading classes...</option>}
              {lookups.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Class Section" htmlFor="sectionId" required error={errors.sectionId}>
            <Select
              id="sectionId"
              value={sectionId}
              onChange={(e) => {
                setSectionId(e.target.value);
                if (errors.sectionId) setErrors((prev) => ({ ...prev, sectionId: undefined }));
              }}
            >
              {availableSections.length === 0 && <option value="">No sections available</option>}
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Row 4: Admission No. & Registration No. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Admission Number (Optional)" htmlFor="admissionNo" error={errors.admissionNo}>
            <Input
              id="admissionNo"
              type="text"
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              placeholder="e.g. ADM-2024-089"
            />
          </FormField>

          <FormField label="Registration Number (Optional)" htmlFor="registrationNo" error={errors.registrationNo}>
            <Input
              id="registrationNo"
              type="text"
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              placeholder="e.g. REG-88210"
            />
          </FormField>
        </div>

        {/* Row 5: Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Student / Parent Email (Optional)" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="e.g. student@school.edu"
              hasError={!!errors.email}
            />
          </FormField>

          <FormField label="Contact Phone (Optional)" htmlFor="phone" error={errors.phone}>
            <Input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (555) 234-5678"
            />
          </FormField>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
