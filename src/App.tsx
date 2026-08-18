import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TeacherDashboardView } from './components/dashboard/TeacherDashboardView';
import { ObservationsView } from './components/observations/ObservationsView';
import { ObservationDetailView } from './components/observations/ObservationDetailView';
import { TeacherAddConcernView } from './components/observations/TeacherAddConcernView';
import { AssessmentsView } from './components/assessments/AssessmentsView';
import { AssessmentRunnerView } from './components/assessments/AssessmentRunnerView';
import { AssessmentResultView } from './components/assessments/AssessmentResultView';
import { ReportsView } from './components/reports/ReportsView';
import { StudentReportPreviewView } from './components/reports/StudentReportPreviewView';
import { StudentsView } from './components/students/StudentsView';
import { StudentProfileView } from './components/students/StudentProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { ParentFeedbackView } from './components/parent-feedback/ParentFeedbackView';
import { PsychologistInterpretationView } from './components/assessments/PsychologistInterpretationView';
import { AssessmentSetupView } from './components/assessments/AssessmentSetupView';
import { LoginView } from './components/auth/LoginView';
import { NewObservationModal } from './components/observations/NewObservationModal';
import { NewAssessmentModal } from './components/assessments/NewAssessmentModal';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Brain } from 'lucide-react';

import {
  initialStudents,
  initialObservations,
  assessmentProtocols,
  sampleAssessmentResult,
  demoUsers,
} from './data/mockData';
import {
  ActiveTab,
  Student,
  ObservationRecord,
  AssessmentProtocol,
  AssessmentResult,
  UserRole,
} from './types';

const getTabFromPath = (): ActiveTab => {
  // Check hash first (e.g. #/teacher-add-concern or #teacher_add_concern)
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  
  // Check URL query parameters (e.g. ?tab=teacher_add_concern)
  const urlParams = new URLSearchParams(window.location.search);
  const paramTab = (urlParams.get('tab') || urlParams.get('view') || '').toLowerCase().trim();

  // Check pathname, stripping any repo subpaths (e.g. /eduwell-psych/)
  const segments = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = (segments[segments.length - 1] === 'eduwell-psych' ? '' : segments[segments.length - 1] || '').toLowerCase().trim();

  const path = hash || paramTab || lastSegment;

  if (path === 'login' || path === 'auth' || path === 'signin') return 'login';
  if (path === 'students') return 'students';
  if (
    path === 'student_profile' ||
    path === 'student-profile' ||
    path === 'student_profile_assessments' ||
    path === 'student_profile_observations' ||
    path === 'student-observations' ||
    path === 'student_profile_reports' ||
    path === 'student-reports' ||
    path === 'profile'
  )
    return 'student_profile';
  if (path === 'observations') return 'observations';
  if (path === 'teacher_dashboard' || path === 'teacher-dashboard' || path === 'teacher') return 'teacher_dashboard';
  if (path === 'teacher_add_concern' || path === 'teacher-add-concern' || path === 'log-observation' || path === 'new-observation') return 'teacher_add_concern';
  if (path === 'observation_detail' || path === 'observation-detail' || path === 'observation') return 'observation_detail';
  if (path === 'assessments') return 'assessments';
  if (path === 'assessment_setup' || path === 'assessment-setup' || path === 'setup') return 'assessment_setup';
  if (path === 'assessment_runner' || path === 'assessment-runner' || path === 'assessment') return 'assessment_runner';
  if (path === 'assessment_result' || path === 'assessment-result' || path === 'results') return 'assessment_result';
  if (path === 'student_report_preview' || path === 'student-report-preview' || path === 'report-preview' || path === 'report_preview') return 'student_report_preview';
  if (path === 'reports') return 'reports';
  if (path === 'settings') return 'settings';
  if (path === 'parent-feedback' || path === 'parent_feedback' || path === 'parent-form' || path === 'feedback' || path === 'parent') return 'parent_feedback';
  if (path === 'psychologist_interpretation' || path === 'psychologist-interpretation' || path === 'interpretation') return 'psychologist_interpretation';
  return 'dashboard';
};

function MainApplication() {
  const { user: currentUser, isLoading: isAuthLoading, logout, login } = useAuth();

  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromPath());
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student>(initialStudents[0]);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    if (tab === 'dashboard') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = `#${tab}`;
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'login') {
        if (currentUser.role === 'teacher') {
          setActiveTab('teacher_dashboard');
        } else if (currentUser.role === 'parent') {
          setActiveTab('parent_feedback');
        } else {
          setActiveTab('dashboard');
        }
      }
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    await logout();
    setActiveTab('login');
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
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
  const [psychologistReportData, setPsychologistReportData] = useState<{
    studentName?: string;
    clinicalInterpretation?: string;
    recommendations?: string;
  }>({});

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
    setActiveTab('assessment_setup');
  };

  const handleStartProtocol = (protocol: AssessmentProtocol) => {
    setSelectedProtocol(protocol);
    setActiveAssessmentStudent('Alex Santos');
    setActiveTab('assessment_setup');
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

  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleSelectStudentFromRoster = (student: Student) => {
    setActiveAssessmentStudent(student.name);
    setSelectedProtocol(protocols[0]);
    setActiveTab('assessment_runner');
  };

  // Auth Loading Splash Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20 flex items-center justify-center animate-pulse">
            <Brain className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
            <span>Restoring secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated or Login view
  if (!currentUser || activeTab === 'login') {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-800 flex antialiased">
      <Toaster position="top-right" richColors />
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        observationCount={observations.filter((o) => o.status === 'Pending Review' || o.status === 'New').length}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          user={currentUser}
          onSignOut={handleSignOut}
          onNavigateTab={setActiveTab}
          onOpenHelp={() =>
            alert(
              'EduWell Psych Professional Suite Help:\n- Dashboard: Aggregate cohort overview\n- Teacher Dashboard: Daily student overview & rapid concern logging\n- Observations: Review and triage teacher/parent reports\n- Assessments: Conduct structured standardized screenings\n- Reports: District and grade-level analytics'
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

          {activeTab === 'teacher_dashboard' && (
            <TeacherDashboardView
              onAddConcern={() => setActiveTab('teacher_add_concern')}
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

          {activeTab === 'teacher_add_concern' && (
            <TeacherAddConcernView
              students={students}
              onSubmitObservation={handleAddObservation}
              onCancel={() => setActiveTab('observations')}
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

          {activeTab === 'assessment_setup' && (
            <AssessmentSetupView
              students={students}
              protocol={selectedProtocol}
              selectedStudentName={activeAssessmentStudent}
              onStartAssessment={(studentName, prot) => {
                setActiveAssessmentStudent(studentName);
                setSelectedProtocol(prot);
                setActiveTab('assessment_runner');
              }}
              onCancel={() => setActiveTab('assessments')}
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

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              onSelectStudentReport={(s) => {
                setActiveAssessmentStudent(s.name);
                setSelectedProfileStudent(s);
                setPsychologistReportData({});
                setActiveTab('student_report_preview');
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'student_report_preview' && (() => {
            const targetStudent =
              students.find(
                (s) =>
                  s.name === psychologistReportData.studentName ||
                  s.name === activeAssessmentStudent
              ) ||
              selectedProfileStudent ||
              students[0];
            return (
              <StudentReportPreviewView
                student={targetStudent}
                students={students}
                assessmentResult={assessmentResult}
                psychologistNotes={psychologistReportData}
                authorName={currentUser?.name}
                onSelectStudent={(s) => {
                  setActiveAssessmentStudent(s.name);
                  setSelectedProfileStudent(s);
                }}
                onBack={() => setActiveTab('student_profile')}
                setActiveTab={setActiveTab}
              />
            );
          })()}

          {activeTab === 'parent_feedback' && (
            <ParentFeedbackView
              students={students}
              selectedStudentName={activeAssessmentStudent || 'Alex Johnson'}
              onSubmitFeedback={handleAddObservation}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'psychologist_interpretation' && (() => {
            const activeStudent =
              students.find((s) => s.name === activeAssessmentStudent) ||
              selectedProfileStudent ||
              students[0];
            return (
              <PsychologistInterpretationView
                studentName={activeStudent.name}
                recordNumber={activeStudent.studentId}
                grade={activeStudent.grade}
                assessmentDate={
                  assessmentResult?.date ||
                  new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                student={activeStudent}
                assessmentResult={assessmentResult}
                onGenerateReport={(data) => {
                  setPsychologistReportData(data);
                  setActiveTab('student_report_preview');
                }}
                setActiveTab={setActiveTab}
              />
            );
          })()}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              userRole={currentUser?.role}
              onAddStudent={handleAddStudent}
              onSelectStudent={handleSelectStudentFromRoster}
              onOpenFullProfile={(s) => {
                setSelectedProfileStudent(s);
                setActiveTab('student_profile');
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'student_profile' && (
            <StudentProfileView
              student={selectedProfileStudent}
              observations={observations}
              onOpenNewAssessment={(studentName) => {
                setSelectedProtocol(protocols[0]);
                setActiveAssessmentStudent(
                  studentName || selectedProfileStudent?.name || initialStudents[0].name
                );
                setActiveTab('assessment_setup');
              }}
              onGenerateReport={(studentName) => {
                const target =
                  students.find((s) => s.name === studentName) || selectedProfileStudent;
                setActiveAssessmentStudent(target.name);
                setPsychologistReportData({});
                setActiveTab('student_report_preview');
              }}
              onOpenNewObservation={() => setIsNewObservationOpen(true)}
              onSelectAssessmentResult={() => setActiveTab('assessment_result')}
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

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
