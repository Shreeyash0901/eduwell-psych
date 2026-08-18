# EduWell Psych — Frontend MVP Project Submission & Handover Document

**Repository:** [https://github.com/Shreeyash0901/eduwell-psych.git](https://github.com/Shreeyash0901/eduwell-psych.git)  
**Live Demo:** [https://shreeyash0901.github.io/eduwell-psych/](https://shreeyash0901.github.io/eduwell-psych/)  
**Status:** Completed & Production Verified  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Sonner (Toasts), Express + Prisma ORM Backend  

---

## 1. Executive Summary

EduWell Psych is a comprehensive school psychology and student wellness monitoring platform designed to streamline student behavioral tracking, standardized wellness assessments, psychological evaluation reports, and inter-role collaboration between School Psychologists, Educators, and Parents.

This frontend MVP is built to exact Figma/UI specifications with full responsive fidelity, complete state management, rich data visualizations, privacy-safe toast notifications (`sonner`), and multi-role workflows.

---

## 2. Core Modules & Screen Directory

### A. Role-Based Dashboards
1. **Psychologist Main Dashboard (`Dr. Mercer`)**
   - **Route:** `/#dashboard`
   - High-level cohort triage indicators (`Attention Required: 8`, `Under Observation: 14`, `Stable: 142`).
   - Quick Assessment trigger and Recent Priority Cases list with direct triage links.
2. **Teacher Wellness Dashboard (`Sarah Jenkins`)**
   - **Route:** `/#teacher_dashboard`
   - Header with prominent **`+ Add Concern`** action.
   - *My Classes* schedule overview (`Grade 10 - Biology`, `Grade 9 - History`, `Grade 11 - Math`) with live wellness trend indicators.
   - *Recent Concerns* feed (e.g., Liam Davis - Academic Stress, Emma Wilson - Social Interaction).
3. **Class Aggregate Report (`Grade 4, Class B`)**
   - **Route:** `/#dashboard` (Class breakdown toggle)
   - Tier distribution, multi-domain cohort breakdown, and individual student risk matrix.

---

### B. Behavioral Observations & Concern Logging
4. **Log Observation / Teacher Add Concern**
   - **Route:** `/#teacher_add_concern`
   - 3-Step guided observation workflow:
     1. *Select Student* (Auto-suggest search & dropdown).
     2. *Concern Category* (Interactive cards for `Attention`, `Behaviour`, `Learning`, `Social`, `Emotional`, `Other`).
     3. *Observation Details* (Factual details input with 500-character counter and live submission feedback).
5. **Multi-Source Observations Queue**
   - **Route:** `/#observations`
   - Triage queue filtering observations by status (`New`, `Pending Review`, `Reviewed`, `Assessed`) and source (`Teacher`, `Parent`, `Counselor`).
6. **Parent Feedback Intake Form**
   - **Route:** `/#parent_feedback`
   - Structured 5-section intake questionnaire for home-based behavioral observations (Mood, Sleep, Social, Behavioral, School Attitude).

---

### C. Standardized Assessments Engine
7. **Assessment Setup / Student Screener**
   - **Route:** `/#assessment_setup`
   - Step 1 student selector card (e.g., *Alex Santos • Grade 10 • ID: 10482*) and protocol configuration before launch.
8. **Assessment Library & Catalog**
   - **Route:** `/#assessments`
   - Directory of standardized screening protocols (General Wellness Screener, Cognitive Load Assessment, Emotional Wellbeing Scale).
9. **Interactive Assessment Runner**
   - **Route:** `/#assessment_runner`
   - Standardized Likert questionnaire engine with live domain tracking, progress bar, and automated scoring.
10. **Assessment Results & AI Insights**
    - **Route:** `/#assessment_result`
    - Standardized score radars, domain risk meters, AI clinical recommendations, and Tier assignment.
11. **Psychologist Clinical Interpretation**
    - **Route:** `/#psychologist_interpretation`
    - In-depth psychological interpretation view for Student Record `#8472` with clinical narrative, risk assessment, and report finalization.

---

### D. Analytical Reports & Psychological Evaluations
12. **Reports Dashboard Hub**
    - **Route:** `/#reports`
    - Centralized reporting hub with cards for **Student Reports**, **Class Reports**, and **Grade Reports**.
13. **Comprehensive Wellness Report Preview**
    - **Route:** `/#student_report_preview`
    - Formal Confidential Psychological Evaluation for *Elijah Vance* with BASC-3 standardized scores, clinical interpretation, actionable recommendations (Environmental, Executive Functioning, Social-Emotional), and doctor signature block. Supports print and PDF generation.

---

### E. Student 360° Profile
14. **Student Profile (`Alex Johnson`, `Marcus Thorne`, `Alex Mercer`)**
    - **Route:** `/#student_profile`
    - 4 Full-featured interactive tabs:
      - **Overview Tab:** Basic Information, Current Overview indicators (`Elevated Attention`, `Focus Level`, `Social Integration: Stable`, `Sleep Quality Flag`), and Recent Assessment meter (65% At Risk).
      - **Observations Timeline:** Vertical connector timeline with distinct cards for Psychologist Clinical Notes (restricted badge), Teacher Observations (`BEHAVIOUR - ESCALATION` badge), and Parent Feedback.
      - **Assessments Tab:** Historical assessment log with summary cards (Total Assessments: 12, Avg Trend: ↗ Improving) and score tables.
      - **Reports (Document History) Tab:** Document history table with search, filter, and direct preview links for Comprehensive, Observation, and Cognitive reports.

---

### F. Administration & UI System
15. **Settings Page**
    - **Route:** `/#settings`
    - Configuration panels for *School Profile*, *Academic Calendar*, and *Data Privacy / FERPA Compliance*.
16. **Role Switcher**
    - Header quick toggle between **Psychologist View** and **Teacher View**.
17. **Global Toast Notification System (`sonner`)**
    - Privacy-safe, concise status toasts across student enrollment, observation filing, assessment completion, report generation/export, parent feedback submission, link copying, and authentication.
18. **Reusable UI Component Library (`src/components/ui/`)**
    - Modular, accessible components: `Button`, `Modal`, `FormField`, `Input`, `Select`, and `Textarea`.

---

## 3. Technical Verification & Architecture

| Metric | Status | Result |
| :--- | :---: | :--- |
| **TypeScript Compilation** | ✅ Passed | `npx tsc --noEmit` exited with 0 errors |
| **Production Build** | ✅ Passed | `npm run build` compiled cleanly into `dist/` |
| **Toast Notifications** | ✅ Passed | Global `sonner` Toaster with privacy-safe user alerts |
| **Component Architecture** | ✅ Passed | Phase 1 reusable UI library (`src/components/ui/`) |
| **Routing Resilience** | ✅ Passed | Universal routing supporting paths, subpaths (`/eduwell-psych/`), hash links (`#tab`), and search params (`?tab=...`) |
| **Asset Resolution** | ✅ Passed | Configured relative base (`base: './'`) for standalone and GitHub Pages hosting |

---

## 4. How to Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Shreeyash0901/eduwell-psych.git
cd eduwell-psych

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# App will be accessible at http://localhost:5173

# 4. Production build
npm run build
```
