export type ActiveTab =
  | 'login'
  | 'dashboard'
  | 'teacher_dashboard'
  | 'students'
  | 'student_profile'
  | 'observations'
  | 'observation_detail'
  | 'teacher_add_concern'
  | 'assessments'
  | 'assessment_setup'
  | 'assessment_runner'
  | 'assessment_result'
  | 'reports'
  | 'student_report_preview'
  | 'settings'
  | 'parent_feedback'
  | 'psychologist_interpretation'
  | 'super_admin_dashboard'
  | 'super_admin_schools'
  | 'super_admin_audit';

export type UserRole = 'psychologist' | 'teacher' | 'parent' | 'admin' | 'super_admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatarUrl: string;
  schoolName: string;
}

export type WellnessStatus = 'Normal' | 'Monitor' | 'Attention Required';

export type IepStatus = 'No IEP' | 'IEP Active' | '504 Plan Active' | 'Under Evaluation';

export interface Student {
  id: number | string;
  studentId: string;
  externalStudentId?: string | null;
  admissionNo?: string | null;
  registrationNo?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  classId?: number | null;
  className?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
  academicSessionId?: number | null;
  academicSessionName?: string | null;
  photoUrl?: string | null;
  source?: string;
  isActive?: boolean;
  lastSyncedAt?: string | null;

  // Display/Legacy fields used across views
  grade?: string;
  classGroup?: string;
  age?: number;
  homeroom?: string;
  guardianName?: string;
  guardianContact?: string;
  iepStatus?: IepStatus | string;
  priorObsCount?: number;
  status?: WellnessStatus;
  primaryDomainFlag?: string;
  scoreFlag?: number;
  avatarUrl?: string;
  domainScores?: {
    emotionalRegulation: number;
    socialInteraction: number;
    academicAnxiety: number;
    focusAttention: number;
    selfConfidence?: number;
    schoolAdjustment?: number;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentFilterLookups {
  classes: { id: number; name: string }[];
  sections: { id: number; name: string; classId: number }[];
  academicSessions: { id: number; name: string; isCurrent: boolean }[];
}

export interface ObservationRecord {
  id: string;
  recordNumber: string;
  studentId: string;
  studentName: string;
  classGroup: string;
  grade?: string;
  source: 'Teacher' | 'Parent' | 'Counselor' | 'Psychologist';
  concernCategory:
    | 'Attention'
    | 'Behaviour'
    | 'Learning'
    | 'Social'
    | 'Emotional'
    | 'Other'
    | 'Social/Emotional'
    | 'Academic'
    | 'Behavioral'
    | 'Emotional Regulation'
    | string;
  date: string;
  incidentTime: string;
  setting: string;
  status: 'New' | 'Pending Review' | 'Reviewed' | 'Assessed';
  submitter: string;
  narrative: string;
  triggers: string;
  interventions: string;
  psychologistNotes: string;
  aiAnalysis?: string;
}

export interface AssessmentQuestionOption {
  id: number;
  text: string;
  score: number;
  label?: string;
  value?: number;
}

export interface AssessmentQuestion {
  id: number;
  text: string;
  domain: string;
  options?: AssessmentQuestionOption[];
}

export interface AssessmentProtocol {
  id: string;
  title: string;
  description: string;
  domains: string[];
  questionCount: number;
  estTime: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentResult {
  id: string;
  studentId: string;
  studentName: string;
  protocolTitle: string;
  date: string;
  overallScore: number;
  statusTag: string;
  domains: {
    name: string;
    score: number;
    maxScore: number;
    status: 'OPTIMAL' | 'CONCERN' | 'MONITOR';
  }[];
  aiSummary?: string;
}
