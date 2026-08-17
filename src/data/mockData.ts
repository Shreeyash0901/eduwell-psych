import { Student, ObservationRecord, AssessmentProtocol, AssessmentResult, UserSession } from '../types';

export const initialStudents: Student[] = [
  {
    id: 's_elijah',
    studentId: '#883492',
    name: 'Elijah Vance',
    grade: '8th Grade',
    classGroup: '8A',
    age: 13,
    homeroom: 'Homeroom 8A',
    iepStatus: 'Routine Assessment',
    priorObsCount: 2,
    status: 'Attention Required',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    primaryDomainFlag: 'Attention Problems (Score: 6.8)',
    scoreFlag: 6.8,
    domainScores: {
      emotionalRegulation: 5.2,
      socialInteraction: 4.8,
      academicAnxiety: 6.2,
      focusAttention: 3.2,
      selfConfidence: 5.5,
      schoolAdjustment: 6.0
    }
  },
  {
    id: 's_marcus',
    studentId: '88402A',
    name: 'Marcus Thorne',
    grade: 'Grade 9',
    classGroup: '9C',
    age: 14,
    homeroom: 'Homeroom 9C',
    iepStatus: 'Tier 2 Support',
    priorObsCount: 3,
    status: 'Attention Required',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200',
    primaryDomainFlag: 'Emotional Regulation (Score: 3.2)',
    scoreFlag: 3.2,
    domainScores: {
      emotionalRegulation: 3.2,
      socialInteraction: 5.4,
      academicAnxiety: 8.1,
      focusAttention: 4.5,
      selfConfidence: 5.0,
      schoolAdjustment: 5.8
    }
  },
  {
    id: 's_mercer',
    studentId: '8472-A',
    name: 'Alex Mercer',
    grade: 'Grade 8',
    classGroup: '8B',
    age: 13,
    homeroom: 'Homeroom 8B',
    iepStatus: '504 Plan Active',
    priorObsCount: 2,
    status: 'Monitor',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    primaryDomainFlag: 'Cognitive Load (Score: 4.8)',
    scoreFlag: 4.8,
    domainScores: {
      emotionalRegulation: 6.5,
      socialInteraction: 7.8,
      academicAnxiety: 5.2,
      focusAttention: 6.8,
      selfConfidence: 7.0,
      schoolAdjustment: 7.5
    }
  },
  {
    id: 's0',
    studentId: '10482',
    name: 'Alex Santos',
    grade: 'Grade 10',
    classGroup: '10A',
    age: 15,
    homeroom: 'Homeroom 10A',
    iepStatus: 'None Active',
    priorObsCount: 0,
    status: 'Normal',
    primaryDomainFlag: 'Emotional Regulation (Score: 7.8)',
    scoreFlag: 7.8,
    domainScores: {
      emotionalRegulation: 7.8,
      socialInteraction: 8.0,
      academicAnxiety: 3.5,
      focusAttention: 7.2,
      selfConfidence: 8.1,
      schoolAdjustment: 8.5
    }
  },
  {
    id: 's1',
    studentId: 'STU-4029',
    name: 'Liam Miller',
    grade: 'Grade 8',
    classGroup: '8B',
    age: 13,
    homeroom: 'Homeroom 8B',
    iepStatus: 'None Active',
    priorObsCount: 2,
    status: 'Attention Required',
    primaryDomainFlag: 'Emotional Regulation (Score: 2.1)',
    scoreFlag: 2.1,
    domainScores: {
      emotionalRegulation: 2.1,
      socialInteraction: 6.5,
      academicAnxiety: 7.8,
      focusAttention: 4.2,
      selfConfidence: 5.0,
      schoolAdjustment: 6.1
    }
  },
  {
    id: 's2',
    studentId: '#STU-8821',
    name: 'Alex Johnson',
    grade: 'Grade 4',
    classGroup: 'Section B',
    age: 9,
    homeroom: 'Homeroom 4B',
    iepStatus: 'Under Evaluation',
    priorObsCount: 1,
    status: 'Monitor',
    avatarUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=200',
    primaryDomainFlag: 'Focus & Attention (Score: 3.4)',
    scoreFlag: 3.4,
    domainScores: {
      emotionalRegulation: 4.5,
      socialInteraction: 8.2,
      academicAnxiety: 5.5,
      focusAttention: 3.4,
      selfConfidence: 6.8,
      schoolAdjustment: 9.0
    }
  },
  {
    id: 's3',
    studentId: 'STU-4102',
    name: 'Aiden Jenkins',
    grade: 'Grade 5',
    classGroup: '5A',
    age: 10,
    homeroom: 'Homeroom 5A',
    iepStatus: 'None Active',
    priorObsCount: 3,
    status: 'Monitor',
    primaryDomainFlag: 'Social Integration (Score: 4.0)',
    scoreFlag: 4.0,
    domainScores: {
      emotionalRegulation: 6.8,
      socialInteraction: 4.0,
      academicAnxiety: 6.2,
      focusAttention: 7.1,
      selfConfidence: 5.9,
      schoolAdjustment: 7.5
    }
  },
  {
    id: 's4',
    studentId: 'STU-3891',
    name: 'Mia Sanchez',
    grade: 'Grade 4',
    classGroup: '4B',
    age: 9,
    homeroom: 'Homeroom 4B',
    iepStatus: '504 Plan Active',
    priorObsCount: 0,
    status: 'Normal',
    primaryDomainFlag: 'Academic Resilience (Score: 8.1)',
    scoreFlag: 8.1,
    domainScores: {
      emotionalRegulation: 8.0,
      socialInteraction: 8.5,
      academicAnxiety: 3.2,
      focusAttention: 8.4,
      selfConfidence: 8.8,
      schoolAdjustment: 9.2
    }
  },
  {
    id: 's5',
    studentId: 'STU-4210',
    name: 'Ethan Lee',
    grade: 'Grade 6',
    classGroup: '6C',
    age: 11,
    homeroom: 'Homeroom 6C',
    iepStatus: 'None Active',
    priorObsCount: 1,
    status: 'Normal',
    primaryDomainFlag: 'Emotional Regulation (Score: 7.6)',
    scoreFlag: 7.6,
    domainScores: {
      emotionalRegulation: 7.6,
      socialInteraction: 7.9,
      academicAnxiety: 4.0,
      focusAttention: 7.8,
      selfConfidence: 8.1,
      schoolAdjustment: 8.5
    }
  }
];

export const initialObservations: ObservationRecord[] = [
  {
    id: 'obs-845',
    recordNumber: '#845',
    studentId: 'STU-3104',
    studentName: 'Leo Martinez',
    classGroup: '3B',
    source: 'Teacher',
    concernCategory: 'Social/Emotional',
    date: 'Oct 24',
    incidentTime: 'Oct 24, 2023 - 10:15 AM',
    setting: 'Classroom 3B',
    status: 'New',
    submitter: 'M. Gomez (Homeroom 3B)',
    narrative: 'Observed social isolation during free play and group reading. Sitting alone and hesitating to interact with peers.',
    triggers: 'Unstructured group activities and recess.',
    interventions: 'Facilitated paired buddy activity.',
    psychologistNotes: 'Pending intake review.'
  },
  {
    id: 'obs-844',
    recordNumber: '#844',
    studentId: 'STU-5201',
    studentName: 'Chloe Davis',
    classGroup: '5A',
    source: 'Teacher',
    concernCategory: 'Behavioral',
    date: 'Oct 23',
    incidentTime: 'Oct 23, 2023 - 01:30 PM',
    setting: 'Classroom 5A',
    status: 'Reviewed',
    submitter: 'R. Thompson (5A Teacher)',
    narrative: 'Short attention span noted during direct instruction and transitions. Frequent off-task verbalizations.',
    triggers: 'Long lecture segments (>15 mins).',
    interventions: 'Checklist for desk tasks and visual timers implemented.',
    psychologistNotes: 'Reviewed with classroom teacher. Recommend attention screening.'
  },
  {
    id: 'obs-843',
    recordNumber: '#843',
    studentId: 'STU-2390',
    studentName: 'Samira Patel',
    classGroup: '2C',
    source: 'Counselor',
    concernCategory: 'Social/Emotional',
    date: 'Oct 22',
    incidentTime: 'Oct 22, 2023 - 09:00 AM',
    setting: 'Testing Center',
    status: 'New',
    submitter: 'Counseling Office',
    narrative: 'Significant testing anxiety manifested during diagnostic math quiz. Complained of stomach aches and requested to visit nurse.',
    triggers: 'Timed evaluative tasks.',
    interventions: 'Breathing exercises and untimed test format trial.',
    psychologistNotes: 'Flagged for anxiety assessment protocol.'
  },
  {
    id: 'obs-842',
    recordNumber: '#842',
    studentId: 'STU-4029',
    studentName: 'Liam Miller',
    classGroup: '8B - Science',
    source: 'Teacher',
    concernCategory: 'Emotional Regulation',
    date: 'Oct 20',
    incidentTime: 'Oct 20, 2023 - 11:15 AM',
    setting: 'Science Lab',
    status: 'Pending Review',
    submitter: 'Sarah Jenkins (Science Teacher)',
    narrative: 'During the group lab experiment, Liam became frustrated when his group apparatus fell apart.',
    triggers: 'Group work involving fine motor skills.',
    interventions: 'Offered alternative independent task.',
    psychologistNotes: 'Awaiting psychology intake.'
  }
];

export const assessmentProtocols: AssessmentProtocol[] = [
  {
    id: 'p1',
    title: 'Emotional Wellbeing Inventory',
    description: 'Comprehensive evaluation of current emotional states, anxiety indicators, and resilience levels in academic environments.',
    domains: ['Anxiety', 'Mood', 'Stress'],
    questionCount: 20,
    estTime: '15-20 mins',
    questions: [
      { id: 1, text: 'Student expresses feelings of nervousness before tests or presentations.', domain: 'Anxiety' },
      { id: 2, text: 'Student recovers quickly after making a mistake during classroom activities.', domain: 'Mood' },
      { id: 3, text: 'Student appears overwhelmed when presented with multi-step instructions.', domain: 'Stress' },
      { id: 4, text: 'Student maintains positive relationships with peers during unstructured times.', domain: 'Mood' },
      { id: 5, text: 'Student displays physical signs of stress (e.g. nail biting, restlessness) when tasks are challenging.', domain: 'Stress' },
      { id: 6, text: 'Student seeks support appropriately from teachers when feeling confused or anxious.', domain: 'Anxiety' },
      { id: 7, text: 'Student shows frustration when tasks become difficult.', domain: 'Stress' },
      { id: 8, text: 'Student adapts smoothly to unexpected changes in class schedule.', domain: 'Mood' },
      { id: 9, text: 'Student expresses positive self-worth regarding academic ability.', domain: 'Mood' },
      { id: 10, text: 'Student demonstrates emotional self-regulation when receiving corrective feedback.', domain: 'Anxiety' }
    ]
  },
  {
    id: 'p2',
    title: 'Behavioral Observation Scale',
    description: 'Structured framework for documenting classroom behaviors, identifying triggers, and tracking intervention efficacy.',
    domains: ['Conduct', 'Regulation'],
    questionCount: 30,
    estTime: '25 mins',
    questions: [
      { id: 1, text: 'Student remains seated during independent work sessions.', domain: 'Regulation' },
      { id: 2, text: 'Student respects classroom rules and guidelines during transitions.', domain: 'Conduct' },
      { id: 3, text: 'Student uses appropriate tone and volume when speaking to staff.', domain: 'Conduct' },
      { id: 4, text: 'Student manages impulse responses when interrupted or challenged.', domain: 'Regulation' },
      { id: 5, text: 'Student completes assigned tasks without requiring frequent verbal redirection.', domain: 'Regulation' }
    ]
  },
  {
    id: 'p3',
    title: 'Attention Profile Assessor',
    description: 'Targeted screening for executive functioning challenges, working memory deficits, and sustained attention capacity.',
    domains: ['Focus', 'Exec. Function'],
    questionCount: 45,
    estTime: '30-40 mins',
    questions: [
      { id: 1, text: 'Student maintains focus during 20+ minute instructional segments.', domain: 'Focus' },
      { id: 2, text: 'Student organizes materials efficiently prior to starting assigned work.', domain: 'Exec. Function' },
      { id: 3, text: 'Student completes long-term projects through step-by-step planning.', domain: 'Exec. Function' },
      { id: 4, text: 'Student filters out extraneous auditory stimuli during individual desk work.', domain: 'Focus' }
    ]
  }
];

export const sampleAssessmentResult: AssessmentResult = {
  id: 'res-101',
  studentId: 'STU-4055',
  studentName: 'Alex Johnson',
  protocolTitle: 'Emotional Wellbeing Scale',
  date: 'Oct 25, 2023',
  overallScore: 72,
  statusTag: 'Screening Result',
  domains: [
    { name: 'Emotional Regulation', score: 45, maxScore: 100, status: 'CONCERN' },
    { name: 'Social Interaction', score: 82, maxScore: 100, status: 'OPTIMAL' },
    { name: 'Self Confidence', score: 68, maxScore: 100, status: 'OPTIMAL' },
    { name: 'School Adjustment', score: 90, maxScore: 100, status: 'OPTIMAL' }
  ]
};

export const demoUsers: UserSession[] = [
  {
    id: 'u-psych',
    name: 'Dr. Sarah Jenkins',
    email: 'dr.jenkins@eduwell.org',
    role: 'psychologist',
    roleTitle: 'Lead School Psychologist',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln High School (District 4)'
  },
  {
    id: 'u-teacher',
    name: 'Sarah Jenkins (Educator)',
    email: 'sarah.teacher@eduwell.org',
    role: 'teacher',
    roleTitle: 'Primary Science & Homeroom Educator',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln High School (Grade 9-11)'
  },
  {
    id: 'u-parent',
    name: 'Sarah Johnson',
    email: 'parent.johnson@eduwell.org',
    role: 'parent',
    roleTitle: 'Parent / Guardian of Alex Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln High School'
  },
  {
    id: 'u-admin',
    name: 'Principal Robert Mercer',
    email: 'admin@eduwell.org',
    role: 'admin',
    roleTitle: 'District Administrator & Principal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    schoolName: 'Lincoln Unified District #42'
  }
];
