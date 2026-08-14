export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'observations'
  | 'observation_detail'
  | 'assessments'
  | 'assessment_runner'
  | 'assessment_result'
  | 'reports'
  | 'settings';

export type WellnessStatus = 'Normal' | 'Monitor' | 'Attention Required';

export interface Student {
  id: string;
  studentId: string;
  name: string;
  grade: string;
  classGroup: string;
  age: number;
  homeroom: string;
  iepStatus: string;
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
  concernCategory: 'Social/Emotional' | 'Academic' | 'Behavioral' | 'Emotional Regulation';
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
