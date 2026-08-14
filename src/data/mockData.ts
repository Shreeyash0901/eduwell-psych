import { Student, ObservationRecord, AssessmentProtocol, AssessmentResult } from '../types';

export const initialStudents: Student[] = [
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
    studentId: 'STU-4055',
    name: 'Alex Johnson',
    grade: 'Grade 4',
    classGroup: '4B',
    age: 9,
    homeroom: 'Homeroom 4B',
    iepStatus: 'Under Evaluation',
    priorObsCount: 1,
    status: 'Monitor',
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
    id: 'obs-842',
    recordNumber: '#842',
    studentId: 'STU-4029',
    studentName: 'Liam Miller',
    classGroup: '8B - Science',
    source: 'Teacher',
    concernCategory: 'Emotional Regulation',
    date: 'Oct 24, 2023',
    incidentTime: 'Oct 23, 2023 - 11:15 AM',
    setting: 'Science Lab',
    status: 'Pending Review',
    submitter: 'Sarah Jenkins (Science Teacher)',
    narrative: 'During the group lab experiment, Liam became highly frustrated when his group\'s apparatus fell apart. Instead of asking for help, he pushed the materials off the desk and put his head down, refusing to speak for the remainder of the 45-minute period. When approached, he covered his ears. This is the third similar incident this month during collaborative work tasks, indicating a potential struggle with social problem-solving or frustration tolerance in group settings.',
    triggers: 'Group work involving fine motor skills and shared materials; failure of an immediate task.',
    interventions: 'Offered alternative independent task (refused); verbal reassurance (ignored); given space.',
    psychologistNotes: ''
  },
  {
    id: 'obs-843',
    recordNumber: '#843',
    studentId: 'STU-4102',
    studentName: 'Aiden Jenkins',
    classGroup: '5A - Math',
    source: 'Teacher',
    concernCategory: 'Social/Emotional',
    date: 'Oct 24, 2023',
    incidentTime: 'Oct 24, 2023 - 09:30 AM',
    setting: 'Math Classroom',
    status: 'New',
    submitter: 'David Vance (Math Teacher)',
    narrative: 'Aiden withdrew from small group math exercise after peer disagreement regarding problem solution steps. Sat silently at desk and refused peer prompts.',
    triggers: 'Peer conflict during group problem solving.',
    interventions: 'Prompted student to express perspective; provided alternative problem card.',
    psychologistNotes: ''
  },
  {
    id: 'obs-841',
    recordNumber: '#841',
    studentId: 'STU-3891',
    studentName: 'Mia Sanchez',
    classGroup: '4B - General',
    source: 'Parent',
    concernCategory: 'Academic',
    date: 'Oct 23, 2023',
    incidentTime: 'Oct 22, 2023 - 07:00 PM',
    setting: 'Home - Homework Time',
    status: 'Reviewed',
    submitter: 'Parent Communication Log',
    narrative: 'Parent reported increased tearfulness during evening reading assignments and expressions of fear regarding upcoming standardized tests.',
    triggers: 'Timed reading assessments and homework load.',
    interventions: 'Parent adjusted study timer and provided frequent 5-minute break intervals.',
    psychologistNotes: 'Reviewed in weekly wellness check. Recommended 504 accommodation review.'
  },
  {
    id: 'obs-840',
    recordNumber: '#840',
    studentId: 'STU-4210',
    studentName: 'Ethan Lee',
    classGroup: '6C - Science',
    source: 'Teacher',
    concernCategory: 'Behavioral',
    date: 'Oct 20, 2023',
    incidentTime: 'Oct 20, 2023 - 01:45 PM',
    setting: 'Science Lab',
    status: 'Assessed',
    submitter: 'Sarah Jenkins (Science Teacher)',
    narrative: 'Student showed fidgeting and difficulty staying seated during instructions, but responded well to tactile stress tool provided.',
    triggers: 'Direct instruction periods exceeding 20 minutes.',
    interventions: 'Seating adjustment closer to front board; sensory desk tool provided.',
    psychologistNotes: 'Assessment completed on Oct 25. Attention profile score within normal range with minor accommodation.'
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
