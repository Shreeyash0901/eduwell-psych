export type AttentionLevel = 'Normal' | 'Monitor' | 'Attention Required' | 'High Priority';
export type StudentStatus = 'Active Monitoring' | 'Stable' | 'Urgent Intervention';

export interface Student {
  id: string;
  name: string;
  age: string;
  dob: string;
  gender: string;
  grade: string;
  section: string;
  homeroomTeacher: string;
  teacherId: string;
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  status: StudentStatus;
  attentionLevel: AttentionLevel;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  targetAge: string;
  active: boolean;
  questions: AssessmentQuestion[];
}

export interface DomainScore {
  domain: string;
  score: number;
  level: AttentionLevel;
}

export interface AssessmentResult {
  id: string;
  studentId: string;
  assessmentId: string;
  date: string;
  completedBy: string;
  status: string;
  domainScores: DomainScore[];
  interpretation: string;
  followUp: string;
}

export interface Observation {
  id: string;
  studentId: string;
  observerRole: string;
  observerName: string;
  date: string;
  type: string;
  details: string;
  confidential: boolean;
}

export interface Intervention {
  id: string;
  studentId: string;
  date: string;
  type: string;
  objective: string;
  notes: string;
  recommendation: string;
  followUp: string;
  status: string;
  outcome: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// In-memory mock DB
let db = {
  currentUser: {
    role: 'psychologist',
    name: 'Dr. Evelyn Carter',
    id: 'PSY-01'
  },
  students: [
    {
      id: 'STU-8821',
      name: 'Alex Johnson',
      age: '9 Years',
      dob: '2017-04-12',
      gender: 'Male',
      grade: 'Grade 4',
      section: 'Section B',
      homeroomTeacher: 'Mr. Davis',
      teacherId: 'TCH-102',
      parentName: 'Sarah Johnson',
      parentRelation: 'Mother',
      parentPhone: '+1 (555) 234-5678',
      status: 'Active Monitoring' as StudentStatus,
      attentionLevel: 'Attention Required' as AttentionLevel
    },
    {
      id: 'STU-4402',
      name: 'Maria Garcia',
      age: '11 Years',
      dob: '2015-08-22',
      gender: 'Female',
      grade: 'Grade 6',
      section: 'Section A',
      homeroomTeacher: 'Mrs. Sterling',
      teacherId: 'TCH-104',
      parentName: 'Jose Garcia',
      parentRelation: 'Father',
      parentPhone: '+1 (555) 890-1234',
      status: 'Stable' as StudentStatus,
      attentionLevel: 'Normal' as AttentionLevel
    },
    {
      id: 'STU-9011',
      name: 'Liam Chen',
      age: '8 Years',
      dob: '2018-11-05',
      gender: 'Male',
      grade: 'Grade 3',
      section: 'Section C',
      homeroomTeacher: 'Miss Thompson',
      teacherId: 'TCH-105',
      parentName: 'Mei Chen',
      parentRelation: 'Mother',
      parentPhone: '+1 (555) 432-1098',
      status: 'Urgent Intervention' as StudentStatus,
      attentionLevel: 'High Priority' as AttentionLevel
    }
  ],
  assessments: [
    {
      id: 'SDQ',
      title: 'Strengths & Difficulties Questionnaire (SDQ)',
      description: 'Behavioral screening tool for children and adolescents.',
      targetAge: '4-17 Years',
      active: true,
      questions: [
        { id: 'q1', text: 'I try to be nice to other people. I care about their feelings.', type: 'likert' },
        { id: 'q2', text: 'I am restless, I cannot sit still for long.', type: 'likert' },
        { id: 'q3', text: 'I get a lot of headaches, stomach-aches or sickness.', type: 'likert' },
        { id: 'q4', text: 'I usually share with others, for example CD\'s, games, food.', type: 'likert' },
        { id: 'q5', text: 'I get very angry and often lose my temper.', type: 'likert' }
      ]
    },
    {
      id: 'BASC-3',
      title: 'Behavioral Screener (BASC-3)',
      description: 'Assesses behavior, emotions, and adaptiveness in school settings.',
      targetAge: 'Grade 1 - 12',
      active: true,
      questions: [
        { id: 'q1', text: 'Has difficulty paying attention during group sessions.', type: 'likert' },
        { id: 'q2', text: 'Appears sad or withdrawn from peers.', type: 'likert' },
        { id: 'q3', text: 'Completes assigned school tasks on time.', type: 'likert' }
      ]
    }
  ],
  assessmentResults: [
    {
      id: 'res-01',
      studentId: 'STU-8821',
      assessmentId: 'BASC-3',
      date: '2026-07-28',
      completedBy: 'Teacher (Mr. Davis)',
      status: 'Completed',
      domainScores: [
        { domain: 'Emotional Wellbeing', score: 65, level: 'Monitor' as AttentionLevel },
        { domain: 'Attention & Concentration', score: 78, level: 'Attention Required' as AttentionLevel },
        { domain: 'Social Interaction', score: 48, level: 'Normal' as AttentionLevel }
      ],
      interpretation: 'Alex exhibits noticeable challenges focusing in the mornings, though peer interactions are healthy.',
      followUp: '2026-09-01'
    }
  ],
  observations: [
    {
      id: 'obs-01',
      studentId: 'STU-8821',
      observerRole: 'Teacher',
      observerName: 'Mr. Davis',
      date: '2026-08-11',
      type: 'Classroom Behaviour',
      details: 'Alex has shown signs of academic disengagement over the past two weeks, correlating with reported sleep issues from home.',
      confidential: false
    },
    {
      id: 'obs-02',
      studentId: 'STU-8821',
      observerRole: 'Psychologist',
      observerName: 'Dr. Evelyn Carter',
      date: '2026-08-12',
      type: 'Clinical Session Notes',
      details: 'Discussed morning fatigue with Alex. He states he stays awake thinking about class performance. Shows moderate anxiety regarding math tests.',
      confidential: true
    }
  ],
  interventions: [
    {
      id: 'int-01',
      studentId: 'STU-8821',
      date: '2026-08-12',
      type: 'Individual counselling',
      objective: 'Address anxiety and sleep hygiene patterns.',
      notes: 'Conducted first mindfulness and breathing training session. Given sleep schedule tips sheet.',
      recommendation: 'Check-in on sleep times twice weekly.',
      followUp: '2026-08-19',
      status: 'Open',
      outcome: 'Pending follow-up'
    }
  ],
  auditLogs: [
    {
      id: 'log-01',
      timestamp: '2026-08-13T10:42:00Z',
      user: 'Dr. Evelyn Carter (Psychologist)',
      action: 'Student Profile Viewed',
      details: 'Viewed student record for Alex Johnson (STU-8821)'
    }
  ]
};

// API Functions
export const api = {
  async getStudents(): Promise<Student[]> {
    return [...db.students];
  },
  
  async getStudent(id: string): Promise<Student | undefined> {
    return db.students.find(s => s.id === id);
  },
  
  async getObservations(studentId?: string): Promise<Observation[]> {
    if (studentId) {
      return db.observations.filter(o => o.studentId === studentId);
    }
    return [...db.observations];
  },
  
  async getAssessments(): Promise<Assessment[]> {
    return [...db.assessments];
  },
  
  async getAssessment(id: string): Promise<Assessment | undefined> {
    return db.assessments.find(a => a.id === id);
  },
  
  async getAssessmentResults(studentId?: string): Promise<AssessmentResult[]> {
    if (studentId) {
      return db.assessmentResults.filter(r => r.studentId === studentId);
    }
    return [...db.assessmentResults];
  },
  
  async addObservation(obs: Omit<Observation, 'id' | 'date'>): Promise<Observation> {
    const newObs: Observation = {
      ...obs,
      id: `obs-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    db.observations.push(newObs);
    return newObs;
  },

  async addAssessmentResult(result: Omit<AssessmentResult, 'id' | 'date'>): Promise<AssessmentResult> {
    const newResult: AssessmentResult = {
      ...result,
      id: `res-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    db.assessmentResults.push(newResult);
    return newResult;
  },
  
  async addIntervention(intv: Omit<Intervention, 'id' | 'date'>): Promise<Intervention> {
    const newIntv: Intervention = {
      ...intv,
      id: `int-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    db.interventions.push(newIntv);
    return newIntv;
  }
};
