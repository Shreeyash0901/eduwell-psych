import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ObservationsView } from './components/observations/ObservationsView';
import { ObservationDetailView } from './components/observations/ObservationDetailView';
import { AssessmentsView } from './components/assessments/AssessmentsView';
import { AssessmentRunnerView } from './components/assessments/AssessmentRunnerView';
import { AssessmentResultView } from './components/assessments/AssessmentResultView';
import { ReportsView } from './components/reports/ReportsView';
import { StudentsView } from './components/students/StudentsView';
import { SettingsView } from './components/settings/SettingsView';
import { NewObservationModal } from './components/observations/NewObservationModal';
import { NewAssessmentModal } from './components/assessments/NewAssessmentModal';

import {
  initialStudents,
  initialObservations,
  assessmentProtocols,
  sampleAssessmentResult,
} from './data/mockData';
import {
  ActiveTab,
  Student,
  ObservationRecord,
  AssessmentProtocol,
  AssessmentResult,
} from './types';

const getTabFromPath = (): ActiveTab => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (path === 'students') return 'students';
  if (path === 'observations') return 'observations';
  if (path === 'observation_detail' || path === 'observation-detail' || path === 'observation') return 'observation_detail';
  if (path === 'assessments') return 'assessments';
  if (path === 'assessment_runner' || path === 'assessment-runner' || path === 'assessment') return 'assessment_runner';
  if (path === 'assessment_result' || path === 'assessment-result' || path === 'results') return 'assessment_result';
  if (path === 'reports') return 'reports';
  if (path === 'settings') return 'settings';
  return 'dashboard';
};

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromPath());

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [students] = useState<Student[]>(initialStudents);
  const [observations, setObservations] = useState<ObservationRecord[]>(initialObservations);
  const [protocols] = useState<AssessmentProtocol[]>(assessmentProtocols);

  // Active Selection State
  const [selectedObservation, setSelectedObservation] = useState<ObservationRecord>(
    initialObservations[0]
  );
  const [selectedProtocol, setSelectedProtocol] = useState<AssessmentProtocol>(
    assessmentProtocols[0]
  );
  const [activeAssessmentStudent, setActiveAssessmentStudent] = useState<string>('Alex Johnson');
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult>(
    sampleAssessmentResult
  );

  // Modal Open States
  const [isNewObservationOpen, setIsNewObservationOpen] = useState<boolean>(false);
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState<boolean>(false);

  // Navigation Handlers
  const handleSelectObservation = (obs: ObservationRecord) => {
    setSelectedObservation(obs);
    setActiveTab('observation_detail');
  };

  const handleStartAssessmentFromObs = (studentName: string) => {
    setActiveAssessmentStudent(studentName);
    setSelectedProtocol(protocols[0]);
    setActiveTab('assessment_runner');
  };

  const handleStartProtocol = (protocol: AssessmentProtocol) => {
    setSelectedProtocol(protocol);
    setActiveAssessmentStudent('Alex Johnson');
    setActiveTab('assessment_runner');
  };

  const handleStartAssessmentModal = (studentName: string, protocol: AssessmentProtocol) => {
    setActiveAssessmentStudent(studentName);
    setSelectedProtocol(protocol);
    setActiveTab('assessment_runner');
  };

  const handleCompleteAssessment = (
    studentName: string,
    answers: Record<number, number>
  ) => {
    // Calculate simple dynamic scores based on answers
    const values = Object.values(answers);
    const meanVal = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 3;
    const overallScore = Math.round((meanVal / 5) * 100);

    const newResult: AssessmentResult = {
      id: `res-${Date.now()}`,
      studentId: 'STU-4055',
      studentName,
      protocolTitle: selectedProtocol.title,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      overallScore,
      statusTag: 'Screening Result',
      domains: [
        {
          name: 'Emotional Regulation',
          score: Math.max(30, overallScore - 15),
          maxScore: 100,
          status: overallScore < 60 ? 'CONCERN' : 'OPTIMAL',
        },
        {
          name: 'Social Interaction',
          score: Math.min(95, overallScore + 10),
          maxScore: 100,
          status: 'OPTIMAL',
        },
        {
          name: 'Self Confidence',
          score: overallScore,
          maxScore: 100,
          status: 'OPTIMAL',
        },
        {
          name: 'School Adjustment',
          score: Math.min(98, overallScore + 18),
          maxScore: 100,
          status: 'OPTIMAL',
        },
      ],
    };

    setAssessmentResult(newResult);
    setActiveTab('assessment_result');
  };

  const handleSaveObservationNotes = (id: string, notes: string) => {
    setObservations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, psychologistNotes: notes } : o))
    );
    if (selectedObservation.id === id) {
      setSelectedObservation((prev) => ({ ...prev, psychologistNotes: notes }));
    }
  };

  const handleUpdateObservationStatus = (
    id: string,
    status: 'Reviewed' | 'Pending Review' | 'Assessed'
  ) => {
    setObservations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    if (selectedObservation.id === id) {
      setSelectedObservation((prev) => ({ ...prev, status }));
    }
  };

  const handleAddObservation = (newObs: ObservationRecord) => {
    setObservations((prev) => [newObs, ...prev]);
  };

  const handleSelectStudentFromRoster = (student: Student) => {
    setActiveAssessmentStudent(student.name);
    setSelectedProtocol(protocols[0]);
    setActiveTab('assessment_runner');
  };

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-800 flex antialiased">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        observationCount={observations.filter((o) => o.status === 'Pending Review' || o.status === 'New').length}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenHelp={() =>
            alert(
              'EduWell Psych Professional Suite Help:\n- Dashboard: Aggregate cohort overview\n- Observations: Review and triage teacher/parent reports\n- Assessments: Conduct structured standardized screenings\n- Reports: District and grade-level analytics'
            )
          }
        />

        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              onSelectStudent={handleSelectStudentFromRoster}
              onOpenNewAssessment={() => setIsNewAssessmentOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'observations' && (
            <ObservationsView
              observations={observations}
              onSelectObservation={handleSelectObservation}
              onOpenNewNote={() => setIsNewObservationOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'observation_detail' && (
            <ObservationDetailView
              observation={selectedObservation}
              onBack={() => setActiveTab('observations')}
              onStartAssessment={handleStartAssessmentFromObs}
              onSaveNotes={handleSaveObservationNotes}
              onUpdateStatus={handleUpdateObservationStatus}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'assessments' && (
            <AssessmentsView
              protocols={protocols}
              onStartProtocol={handleStartProtocol}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'assessment_runner' && (
            <AssessmentRunnerView
              protocol={selectedProtocol}
              students={students}
              selectedStudentName={activeAssessmentStudent}
              onCompleteAssessment={handleCompleteAssessment}
              onCancel={() => setActiveTab('assessments')}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'assessment_result' && (
            <AssessmentResultView
              result={assessmentResult}
              onBack={() => setActiveTab('assessments')}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'reports' && <ReportsView setActiveTab={setActiveTab} />}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              onSelectStudent={handleSelectStudentFromRoster}
              onOpenNewAssessment={() => setIsNewAssessmentOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'settings' && <SettingsView setActiveTab={setActiveTab} />}
        </main>
      </div>

      {/* Global Modals */}
      {isNewObservationOpen && (
        <NewObservationModal
          students={students}
          onClose={() => setIsNewObservationOpen(false)}
          onSubmit={handleAddObservation}
        />
      )}

      {isNewAssessmentOpen && (
        <NewAssessmentModal
          students={students}
          protocols={protocols}
          onClose={() => setIsNewAssessmentOpen(false)}
          onStart={handleStartAssessmentModal}
        />
      )}
    </div>
  );
}
