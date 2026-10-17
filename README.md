<div align="center">

# 🚀 Career-Connect

### The Unified Job Discovery, Placement Preparation & Interview Management Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

[Live Demo](#) · [Report Bug](https://github.com/learnervivek/Career-connect./issues) · [Request Feature](https://github.com/learnervivek/Career-connect./issues)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Modules & Features](#-key-modules--features)
  - [1. Job Discovery & Application Tracking](#1-job-discovery--application-tracking)
  - [2. Company-Wise Placement Preparation Hub](#2-company-wise-placement-preparation-hub)
  - [3. Integrated Interview Coordination](#3-integrated-interview-coordination)
  - [4. Personalized Candidate Command Center](#4-personalized-candidate-command-center)
  - [5. Recruiter & Administrator Management](#5-recruiter--administrator-management)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Seeding (Preparation Hub)](#-database-seeding-preparation-hub)
- [Testing & Quality Verification](#-testing--quality-verification)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [User Roles & Access Control](#-user-roles--access-control)

---

## 🌟 About the Project

**Career-Connect** is a comprehensive full-stack career platform designed to bridge skill preparation, verified job discovery, and interview execution into a single, cohesive ecosystem.

Unlike traditional job boards plagued by stale postings and disjointed communication, Career-Connect supports candidates through the entire career lifecycle:

$$\text{Skill Preparation} \longrightarrow \text{Target Company Prioritization} \longrightarrow \text{1-Click Application} \longrightarrow \text{Interview Coordination} \longrightarrow \text{Offer Tracking}$$

Candidates prepare for recruitment rounds with structured syllabi across 15+ top tech enterprises, track topic completion, and manage direct video interviews—while recruiters post transparent roles, screen applicants, and coordinate multi-round interviews with automated alerts.

---

## ✨ Key Modules & Features

### 1. Job Discovery & Application Tracking
- 🔍 **Smart Multi-Attribute Search** — Search by title, required skills, company name, or city/remote location.
- 💰 **Salary Transparency** — Upfront CTC/salary ranges with zero hidden compensation.
- ⚡ **1-Click Fast Apply** — Submit profile credentials and formatted PDF resumes instantly.
- 📊 **Real-Time Status Pipeline** — Track applications across `Pending`, `Accepted`, and `Rejected` statuses.

### 2. Company-Wise Placement Preparation Hub
- 🏢 **15 Top Initial Enterprises Supported**:
  - **IT Services & Consulting**: TCS, Infosys, Wipro, HCLTech, Cognizant, Capgemini, Accenture, Tech Mahindra.
  - **Product & Technology**: Microsoft, Google, Amazon, IBM, Oracle, Zoho Corporation, Qualcomm.
- 🗺️ **Multi-Track Role Roadmaps** — Entry-level hiring tracks (e.g., TCS NQT Ninja/Digital/Prime, Infosys SE/SP, Google SDE-1, Amazon SDE-1, Qualcomm Embedded/Systems).
- 📚 **Curated Learning Resources** — Topic-level links across DSA, Core CS (OS, DBMS, CN), System Design, and Aptitude.
- 🏷️ **Resource Verification & Obsolete Flagging** — Distinguishes between official company materials, community resources, and unverified links.
- 🔖 **Resource Bookmarking & Notes** — Save high-yield study sheets and record private topic notes.

### 3. Integrated Interview Coordination
- 📅 **Direct Interview Scheduling** — Recruiters schedule Technical, Coding, System Design, or HR rounds with custom meeting links (Google Meet, Zoom, MS Teams).
- 🕒 **Conflict Prevention** — Automatic double-booking detection prevents overlapping active interview slots.
- 🔄 **Candidate 1-Click Confirmation & Rescheduling** — Candidates confirm attendance or submit rescheduling requests with custom proposed dates and reasons.
- 🔔 **Multi-Channel Notifications** — In-app notification bell and automated email alerts on scheduling milestones.
- 📈 **Status Lifecycle**: `Scheduled` $\rightarrow$ `Confirmed` $\rightarrow$ `Reschedule Requested` $\rightarrow$ `Completed` $\rightarrow$ `Cancelled`.

### 4. Personalized Candidate Command Center (`/my-preparation`)
- 🎯 **Target Companies Manager** — Prioritize target employers (`Dream`, `High`, `Medium`) with target roles and custom notes.
- 📊 **Active Roadmap Progress** — Persistent progress bars, completed vs remaining topic counters, and next recommended topic.
- 📅 **Upcoming Interviews Widget** — View upcoming round details, scheduled times, and direct video links.
- 📑 **Saved Learning Resources** — Categorized bookmark list with quick search and filters.

### 5. Recruiter & Administrator Management
- 💼 **Recruiter Portal (`/admin/jobs`)** — Post verified listings, review candidate resumes, and manage applicant status pipelines.
- 🎙️ **Recruiter Interview Desk (`/admin/interviews`)** — View applicants ready for interviews, schedule rounds, and manage confirmations.
- 🛠️ **Admin Preparation Manager (`/admin/preparation`)** — Add/edit companies, reorder roadmap stages and topics, curate learning resources, and archive obsolete tracks safely without corrupting user progress.

---

## 🛠️ Tech Stack

### Frontend (`Client/`)
| Technology | Version / Tool | Purpose |
|---|---|---|
| **React** | v19 | Reactive component UI architecture |
| **Vite** | v6 | Ultra-fast build tool & development server |
| **Redux Toolkit** | v2.6 | Centralized state management (auth, jobs, roadmaps) |
| **React Router** | v7 | Declarative client-side routing & protected routes |
| **Tailwind CSS** | v4 | Modern utility-first responsive styling system |
| **Lucide React** | Latest | Consistent UI iconography |
| **Axios** | v1.8 | Authenticated REST client with cookie support |
| **Sonner** | Latest | Toast notification feedback |

### Backend (`Server/`)
| Technology | Version / Tool | Purpose |
|---|---|---|
| **Node.js** | v20+ / v26 (with compat) | Server runtime |
| **Express.js** | v4.21 | RESTful API server & routing |
| **MongoDB & Mongoose** | v8.12 | Scalable document database & schema modeling |
| **JSON Web Tokens (JWT)** | v9.0 | Role-based authentication & HTTP-only cookies |
| **bcryptjs** | v3.0 | Secure password hashing |
| **Multer & DataURI** | LTS | File upload pipeline for resumes and avatars |
| **Cloudinary** | v2.6 | Cloud storage for user media assets |

---

## 📁 Project Structure

```
career-connect/
│
├── Client/                                # Frontend React (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                    # Recruiter & Admin Management
│   │   │   │   ├── preparation/          # Admin Preparation Hub
│   │   │   │   │   └── AdminPreparationDashboard.jsx
│   │   │   │   ├── AdminJobs.jsx         # Manage job postings
│   │   │   │   ├── Companies.jsx         # Manage company profiles
│   │   │   │   ├── JobApplicants.jsx     # Screen applicant resumes
│   │   │   │   ├── PostJob.jsx           # Create job listings
│   │   │   │   ├── RecruiterInterviews.jsx # Recruiter interview desk
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── preparation/              # Candidate Preparation Hub
│   │   │   │   ├── CompanyPreparationPage.jsx # Catalog with search & filters
│   │   │   │   ├── CompanyDetailsPage.jsx     # Company hiring tracks
│   │   │   │   ├── RoadmapDetailsPage.jsx     # Interactive stages & topics
│   │   │   │   ├── MyPreparationDashboard.jsx # Personalized command center
│   │   │   │   ├── CompanyCard.jsx
│   │   │   │   └── ResourceList.jsx
│   │   │   ├── shared/                   # Navbar, Footer, Notifications
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── NotificationBell.jsx
│   │   │   ├── CandidateInterviews.jsx   # Candidate interview management
│   │   │   ├── LandingPreparationHub.jsx # Dynamic landing preparation preview
│   │   │   ├── LandingInterviewSection.jsx # Landing interview workflow timeline
│   │   │   ├── LandingCandidateDashboardPreview.jsx # Landing dashboard mockup
│   │   │   ├── LandingRecruiterSection.jsx # Landing employer features
│   │   │   ├── HeroSection.jsx           # Unified hero with dual search & CTAs
│   │   │   ├── Home.jsx                  # Main landing page
│   │   │   ├── Jobs.jsx                  # Job catalogue & search
│   │   │   ├── JobDescription.jsx        # Job detail view
│   │   │   └── Profile.jsx               # Candidate profile & resume
│   │   ├── redux/                        # Redux store & state slices
│   │   └── utils/constant.js             # API endpoint configuration
│   └── vite.config.js
│
├── Server/                                # Backend Express REST API
│   ├── controllers/
│   │   ├── preparation.controllers.js    # Public preparation catalog API
│   │   ├── progress.controllers.js       # Topic progress & target companies
│   │   ├── adminPreparation.controllers.js # Admin roadmap & company curation
│   │   ├── interview.controllers.js      # Interview scheduling & coordination
│   │   ├── user.controllers.js           # Auth & profile management
│   │   ├── job.controllers.js            # Job management
│   │   └── company.controllers.js        # Recruiter company profiles
│   ├── middlewares/
│   │   ├── authUser.js                   # JWT authentication middleware
│   │   └── checkRole.js                  # Candidate, Recruiter, Admin authorization
│   ├── models/
│   │   ├── company.models.js             # Company schema (tiers & preparation tracks)
│   │   ├── roadmap.models.js             # Roadmaps, stages & stable topic IDs
│   │   ├── preparationResource.models.js # Curated learning resources
│   │   ├── userRoadmapProgress.models.js # Individual user topic completion & notes
│   │   ├── userTargetCompany.models.js   # User target company priorities
│   │   ├── interview.models.js           # Interview scheduling & statuses
│   │   ├── job.models.js                 # Job opportunities
│   │   └── application.models.js         # Candidate job applications
│   ├── routes/
│   │   ├── preparation.routes.js         # /api/v1/preparation
│   │   ├── progress.routes.js            # /api/v1/progress
│   │   ├── adminPreparation.routes.js    # /api/v1/admin/preparation
│   │   ├── interview.routes.js           # /api/v1/interviews
│   │   └── job.routes.js                 # /api/v1/job
│   ├── scripts/
│   │   └── seed_preparation_hub.js       # Idempotent 15-company seeder
│   ├── test_full_quality_review.js       # 17-test master quality review suite
│   ├── test_interview_integration.js     # 20-test interview regression suite
│   ├── test_preparation_hub.js           # Foundational schema verification
│   ├── test_progress_tracking.js         # Progress & target companies tests
│   ├── test_admin_preparation.js         # Admin management test suite
│   └── index.js                          # Server entry point
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (tested up to v26 with included `node-compat.cjs`)
- **npm** v9+
- A running **MongoDB** database (Local or MongoDB Atlas)
- A **Cloudinary** account (for image & resume uploads)

### 1. Clone the Repository
```bash
git clone https://github.com/learnervivek/Career-connect..git
cd Career-connect.
```

### 2. Backend Setup
```bash
cd Server
npm install
```

Create `Server/.env`:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret
NODE_ENV=development
```

Run database seeding (idempotent bootstrap):
```bash
npm run seed:prep
```

Start the backend server:
```bash
npm run dev
```
The server starts at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd ../Client
npm install
```

Create `Client/.env`:
```env
VITE_BACKEND_URL=http://localhost:8000
```

Start the Vite development server:
```bash
npm run dev
```
The client starts at `http://localhost:5173`.

---

## 🏢 Database Seeding (Preparation Hub)

To bootstrap or refresh the 15 initial companies and starter roadmaps:

```bash
cd Server
npm run seed:prep
```

### Seeding Guarantees:
1. **Full Idempotency**: Matches companies and roadmaps by unique `slug` and resources by `url`. Running multiple times never creates duplicates.
2. **User Progress Preserved**: Candidate completion records (`UserRoadmapProgress`) and target companies (`UserTargetCompany`) are never overwritten.
3. **Deterministic Topic IDs**: Topics maintain stable string IDs across updates, preserving progress calculations if stages are reordered.
4. **Recruiter Profiles Retained**: Existing recruiter job postings and company links are safely preserved.

---

## 🧪 Testing & Quality Verification

All features are covered by automated integration test suites:

| Command | Suite | Workflows Verified |
|---|---|---|
| `npm run test:review` | **Master Quality Review** | 17 workflows: Seeding, catalog browsing, roadmap stages, topic progress, 2-user isolation, target companies, admin roadmap reordering, 401/403 security checks, private notes. |
| `npm test` | **Interview & Job Portal** | 20 workflows: Scheduling, candidate confirmations, reschedule requests, cancellations, conflict prevention, recruiter authorization. |
| `npm run test:prep` | **Schema Foundations** | 10 workflows: Initial 15 companies, roadmap relationships, resource populations. |
| `npm run test:progress` | **Candidate Progress** | 10 workflows: Percentage recalculations, target company CRUD, unchecking topics. |
| `npm run test:admin` | **Admin Hub Management** | 13 workflows: Company/roadmap creation, archive warnings, stage reordering. |
| `npm run test:resources` | **Learning Resources** | Categories, resource types, bookmarking, private notes, obsolete flagging. |

To run the master quality suite:
```bash
cd Server
npm run test:review
```

---

## 📡 API Reference

### 1. Preparation Hub (`/api/v1/preparation`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/companies` | Get catalog with category filter & search | Public |
| `GET` | `/companies/:slugOrId` | Get company details & available roadmaps | Public |
| `GET` | `/roadmaps/:slugOrId` | Get ordered stages, topics & resources | Public |
| `POST` | `/resources/:id/bookmark` | Bookmark / unbookmark learning resource | Candidate |
| `GET` | `/my-resource-bookmarks` | Get candidate's saved resources | Candidate |

### 2. Personalized Progress (`/api/v1/progress`, `/api/v1/my-*`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/progress/:roadmapId` | Get user progress, completed topics & % | Candidate |
| `POST` | `/progress/:roadmapId/start` | Start tracking a roadmap | Candidate |
| `PUT` | `/progress/:roadmapId/topics/:topicId` | Toggle topic completion (true/false) | Candidate |
| `POST` | `/progress/:roadmapId/topics/:topicId/notes` | Save private study notes for topic | Candidate |
| `GET` | `/my-preparation` | Dashboard: Target companies & active tracks | Candidate |
| `POST` | `/my-target-companies` | Add company to target list with priority | Candidate |
| `DELETE` | `/my-target-companies/:id` | Remove company from target list | Candidate |

### 3. Interview Coordination (`/api/v1/interviews`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/candidate` | Get candidate's scheduled interviews | Candidate |
| `PUT` | `/:id/confirm` | Confirm attendance for scheduled interview | Candidate |
| `PUT` | `/:id/reschedule-request` | Request rescheduling with proposed slot | Candidate |
| `POST` | `/schedule` | Schedule interview for accepted applicant | Recruiter |
| `GET` | `/recruiter` | Get recruiter's coordinated interviews | Recruiter |
| `PUT` | `/:id/reschedule` | Reschedule interview date/time | Recruiter |
| `PUT` | `/:id/cancel` | Cancel interview with reason | Recruiter |

### 4. Admin Preparation Management (`/api/v1/admin/preparation`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/companies` | Get company management catalog | Admin |
| `POST` | `/companies` | Add new preparation company | Admin |
| `PUT` | `/companies/:id` | Update company details & hiring tracks | Admin |
| `POST` | `/roadmaps` | Create roadmap with stages & topics | Admin |
| `PUT` | `/roadmaps/:id` | Reorder topics & edit syllabus safely | Admin |
| `PATCH` | `/roadmaps/:id/status` | Publish, Draft, or Archive roadmap | Admin |

### 5. Jobs & Applications (`/api/v1/job`, `/api/v1/application`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/job/get` | Search & filter verified jobs | Public |
| `POST` | `/job/post` | Post a new job opportunity | Recruiter |
| `POST` | `/application/apply/:id` | 1-Click apply to job | Candidate |
| `GET` | `/application/get` | Get candidate application history | Candidate |
| `PUT` | `/application/status/:id/update` | Update applicant status | Recruiter |

---

## 👥 User Roles & Access Control

| Feature / Action | Student / Candidate | Recruiter | Admin |
|---|:---:|:---:|:---:|
| Search & Browse Jobs | ✅ | ✅ | ✅ |
| 1-Click Apply & Resume Upload | ✅ | ❌ | ❌ |
| Company Preparation Roadmaps | ✅ | ✅ | ✅ |
| Topic Progress & Target Companies | ✅ | ❌ | ❌ |
| Confirm / Reschedule Interviews | ✅ | ❌ | ❌ |
| Track Applications & Status Timeline | ✅ | ❌ | ❌ |
| Withdraw Own Active Applications | ✅ | ❌ | ❌ |
| Post Jobs & Review Resumes | ❌ | ✅ | ✅ |
| Update Application Status & Candidate Notes | ❌ | ✅ | ✅ |
| Schedule & Manage Interviews | ❌ | ✅ | ✅ |
| Curate Companies & Roadmaps | ❌ | ❌ | ✅ |

---

## 📬 Job Application Tracking & Email Notification System

Career-Connect provides a transparent application tracking dashboard for candidates and an applicant management pipeline for recruiters with automated transactional email notifications.

### 🌟 Candidate Features
- **Dedicated My Applications Page** (`/my-applications`): Searchable, filterable dashboard with live counter metrics (Total, Under Review, Shortlisted, Selected, Rejected).
- **Cards & Data Table Views**: Switch between rich glassmorphic cards and a data table.
- **Application Reference IDs**: Formatted identifiers (`APP-XXXXXX`) for tracking and correspondence.
- **Chronological Progress Timeline**: Interactive stepper and modal showing every recorded milestone, date, and candidate-visible recruiter feedback.
- **Integrated Interview Rounds**: Directly linked scheduled interviews and meeting links alongside application progress.
- **Candidate Withdrawal**: Safe withdrawal workflow for active applications.

### 💼 Recruiter Applicant Pipeline
- **Pipeline Status Management**: Transition applicants through `Applied` → `Under Review` → `Shortlisted` → `Interview Scheduled` → `Selected` / `Rejected`.
- **Candidate-Visible Feedback**: Add personalized next-step instructions or constructive feedback notes when updating applicant status.
- **Audit & History Inspection**: Open applicant timeline modal to inspect all previous status changes and timestamped notes.

### 📧 Automated Email Notifications
Automated responsive HTML transactional emails with plain-text fallbacks sent via Nodemailer (or safely simulated in development):
- **Application Submitted**: Sent immediately upon saving an application with job title, company, reference ID, and dashboard link.
- **Application Shortlisted**: Sent when moved to Shortlisted/Accepted with next steps guidance.
- **Application Selected**: Outcome notification with congratulations and next steps.
- **Application Rejected**: Respectful status update with optional recruiter-approved feedback note and link to explore other openings.
- **Application Under Review**: Review notification.

#### Environment Variables Configuration:
```env
# Supported SMTP Variables (both EMAIL_* and SMTP_* aliases supported):
EMAIL_HOST="smtp.gmail.com" # or SMTP_HOST
EMAIL_PORT=587              # or SMTP_PORT
EMAIL_SECURE=false          # or SMTP_SECURE
EMAIL_USER="your-email@example.com" # or SMTP_USER
EMAIL_PASS="your-app-password"      # or SMTP_PASS
EMAIL_FROM='"Career Connect" <notifications@careerconnect.com>' # or SMTP_FROM
FRONTEND_URL="http://localhost:5173"
```
*Note: If unconfigured, the system automatically runs in simulated delivery mode without failing requests or blocking operations.*

### 🧪 Automated Test Suites
Run the dedicated test suites:
```bash
# Application Tracking & Notification Integration Tests (14/14 tests)
npm run test:app

# Interview Integration Tests (20/20 tests)
npm test
```

---

## ☁️ Deployment

Career-Connect is architected for deployment across modern cloud platforms:

- **Frontend**: Deployed on **Vercel** (`Client/` root directory). Set `VITE_BACKEND_URL` to your production API origin.
- **Backend**: Deployed on **Vercel Serverless** or **Render/Railway** (`Server/` root directory). Ensure `FRONTEND_URL` matches the deployed client origin.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">

Made with ❤️ by [Vivek Kumar](https://github.com/learnervivek)

⭐ Star this repository if Career-Connect helped you!

</div>
