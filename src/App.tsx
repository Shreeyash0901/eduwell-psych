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
  // Check hash first (e.g. #/teacher-add-concern or #student_profile?id=1)
  const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  const hash = rawHash.split('?')[0].split('/')[0];
  
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
  const [selectedProfileStudentId, setSelectedProfileStudentId] = useState<string | number | null>(() => {
    const hash = window.location.hash;
    const match = hash.match(/[#?]id=([^&]+)/) || hash.match(/#student_profile\/([^?&]+)/);
    return match ? match[1] : null;
  });

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
  const [protocols, setProtocols] = useState<AssessmentProtocol[]>(assessmentProtocols);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [resTemplates, resStudents] = await Promise.all([
          fetch('/api/assessments/templates', { credentials: 'include' }),
          fetch('/api/students?limit=100', { credentials: 'include' })
        ]);
        const dataTemplates = await resTemplates.json();
        const dataStudents = await resStudents.json();
        
        if (dataTemplates.success && !cancelled) {
          const fetchedProtocols = dataTemplates.templates.map((t: any) => ({
            id: String(t.id),
            title: t.name,
            description: t.description || '',
            domains: t.domains.map((d: any) => d.name),
            questionCount: t.questions.length,
            estTime: '15-20 mins',
            questions: t.questions.map((q: any) => ({
              id: q.id,
              text: q.questionText,
              domain: t.domains.find((d: any) => d.id === q.domainId)?.name || 'General',
              options: q.options?.map((o: any) => ({
                id: o.id,
                text: o.optionText,
                score: Number(o.score)
              }))
            }))
          }));
          if (fetchedProtocols.length > 0) {
            setProtocols(fetchedProtocols);
            setSelectedProtocol((prev) => 
              prev.id === assessmentProtocols[0].id ? fetchedProtocols[0] : prev
            );
          }
        }
        
        if (dataStudents.success && !cancelled) {
          const fetchedStudents = dataStudents.students.map((s: any) => ({
            id: String(s.id),
            studentId: s.studentId,
            name: s.fullName || s.firstName + " " + s.lastName,
            grade: s.class?.name || 'N/A',
            school: s.schoolName || 'EduWell'
          }));
          if (fetchedStudents.length > 0) {
            setStudents(fetchedStudents);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    if (currentUser) {
      fetchData();
    }
    return () => { cancelled = true; };
  }, [currentUser]);

  // Active Selection State
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(null);
  const [observationRefreshKey, setObservationRefreshKey] = useState<number>(0);
  const [observationCount, setObservationCount] = useState<number>(0);
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
    setSelectedObservationId(obs.id);
    setActiveTab('observation_detail');
  };

  const handleObservationRefresh = () => {
    setObservationRefreshKey((k) => k + 1);
  };

  // Keep the sidebar observation badge count fresh
  useEffect(() => {
    let cancelled = false;
    const fetchObservationCount = async () => {
      try {
        const res = await fetch('/api/observations?limit=1&page=1', { credentials: 'include' });
        const data = await res.json();
        if (data.success && !cancelled) {
          setObservationCount(data.pagination?.total ?? 0);
        }
      } catch {
        // Non-critical badge count; ignore failures
      }
    };
    fetchObservationCount();
    return () => {
      cancelled = true;
    };
  }, [observationRefreshKey, activeTab]);

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
    answers: Record<number, number>,
    serverAssessment?: any
  ) => {
    const student = students.find((s) => s.name === studentName || s.fullName === studentName);
    
    let overallScore = 90;
    let attentionLevel = 'Optimal';
    let domainsList: any[] = [];

    if (serverAssessment) {
      overallScore = Number(serverAssessment.overallScore) || 0;
      attentionLevel = serverAssessment.attentionLevel || 'Normal';

      if (serverAssessment.domainResults && serverAssessment.domainResults.length > 0) {
        domainsList = serverAssessment.domainResults.map((dr: any) => ({
          name: dr.domain?.name || 'General Domain',
          score: Number(dr.score),
          maxScore: Number(dr.maxScore) || 100,
          status: dr.attentionLevel === 'High' || dr.attentionLevel === 'ATTENTION_REQUIRED' ? 'CONCERN' : 'OPTIMAL',
        }));
      }
    }

    if (domainsList.length === 0) {
      const values = Object.values(answers);
      const meanVal = values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 3;
      overallScore = Math.round((meanVal / 5) * 100);
      domainsList = [
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
      ];
    }

    const newResult: AssessmentResult = {
      id: serverAssessment ? `res-${serverAssessment.id}` : `res-${Date.now()}`,
      studentId: student?.studentId || 'STU-4055',
      studentName,
      protocolTitle: selectedProtocol.title,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      overallScore,
      statusTag: 'Screening Result',
      domains: domainsList,
    };

    setAssessmentResult(newResult);
    setActiveTab('assessment_result');
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
        observationCount={observationCount}
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
              user={currentUser}
              onSelectStudent={handleSelectStudentFromRoster}
              onOpenNewAssessment={() => setIsNewAssessmentOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'teacher_dashboard' && (
            <TeacherDashboardView
              user={currentUser}
              onAddConcern={() => setActiveTab('teacher_add_concern')}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'observations' && (
            <ObservationsView
              refreshKey={observationRefreshKey}
              onSelectObservation={handleSelectObservation}
              onOpenNewNote={() => setIsNewObservationOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'observation_detail' &&
            (selectedObservationId ? (
              <ObservationDetailView
                observationId={selectedObservationId}
                refreshKey={observationRefreshKey}
                canUpdate={currentUser?.role === 'psychologist' || currentUser?.role === 'admin'}
                onBack={() => setActiveTab('observations')}
                onStartAssessment={handleStartAssessmentFromObs}
                setActiveTab={setActiveTab}
              />
            ) : (
              <ObservationsView
                refreshKey={observationRefreshKey}
                onSelectObservation={handleSelectObservation}
                onOpenNewNote={() => setIsNewObservationOpen(true)}
                setActiveTab={setActiveTab}
              />
            ))}

          {activeTab === 'teacher_add_concern' && (
            <TeacherAddConcernView
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
              userRole={currentUser?.role}
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
              selectedStudentName={activeAssessmentStudent || 'Alex Johnson'}
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
              userRole={currentUser?.role}
              onAddStudent={handleAddStudent}
              onSelectStudent={handleSelectStudentFromRoster}
              onOpenFullProfile={(s) => {
                setSelectedProfileStudent(s);
                setSelectedProfileStudentId(s.id);
                window.location.hash = `#student_profile?id=${s.id}`;
                setActiveTab('student_profile');
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'student_profile' && (
            <StudentProfileView
              student={selectedProfileStudent}
              studentId={selectedProfileStudentId || selectedProfileStudent?.id}
              refreshKey={observationRefreshKey}
              onOpenNewAssessment={(studentName) => {
                setSelectedProtocol(protocols[0]);
                setActiveAssessmentStudent(
                  studentName || selectedProfileStudent?.fullName || selectedProfileStudent?.name || 'Alex Morgan'
                );
                setActiveTab('assessment_setup');
              }}
              onGenerateReport={(studentName) => {
                const target =
                  students.find((s) => s.fullName === studentName || s.name === studentName) || selectedProfileStudent;
                setActiveAssessmentStudent(target.fullName || target.name || studentName);
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
          onClose={() => setIsNewObservationOpen(false)}
          onSubmitted={handleObservationRefresh}
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
