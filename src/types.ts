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
  | 'psychologist_interpretation';

export type UserRole = 'psychologist' | 'teacher' | 'parent' | 'admin';

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
  id: string;
  studentId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  grade: string;
  classGroup: string;
  age: number;
  homeroom: string;
  guardianName?: string;
  guardianContact?: string;
  iepStatus: IepStatus | string;
  priorObsCount: number;
  status: WellnessStatus;
  primaryDomainFlag?: string;
  scoreFlag?: number;
  avatarUrl?: string;
  domainScores: {
    emotionalRegulation: number;
    socialInteraction: number;
    academicAnxiety: number;
    focusAttention: number;
    selfConfidence?: number;
    schoolAdjustment?: number;
  };
}

export interface ObservationRecord {
  id: string;
  recordNumber: string;
  studentId: string;
  studentName: string;
  classGroup: string;
  source: 'Teacher' | 'Parent' | 'Counselor';
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

export interface AssessmentQuestion {
  id: number;
  text: string;
  domain: string;
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
