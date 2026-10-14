<div align="center">

# 🚀 Career-Connect

### A modern full-stack job portal platform connecting students with top recruiters

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

[Live Demo](#) · [Report Bug](https://github.com/learnervivek/Career-connect./issues) · [Request Feature](https://github.com/learnervivek/Career-connect./issues)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)

---

## 🌟 About the Project

**Career-Connect** is a premium, full-stack job portal platform built for the modern job market. It bridges the gap between **job seekers (students)** and **recruiters**, offering a seamless experience inspired by platforms like LinkedIn Jobs, Indeed, and Wellfound.

Students can discover opportunities, apply with a single click, and manage their profiles — while recruiters can post jobs, manage companies, and review applicants — all in one place.

---

## ✨ Features

### 👨‍🎓 Student / Job Seeker
- 🔍 **Smart Job Search** — Search by title, skills, company, and location
- 🎛️ **Advanced Filters** — Filter by location, job type, salary range, and industry
- 📄 **Job Details** — Rich formatted job descriptions with apply button
- 👤 **Profile Management** — Update name, bio, skills, resume (PDF), and profile photo
- 📸 **Profile Photo Upload** — Click avatar to instantly update photo (Cloudinary-powered)
- 📋 **Application Tracker** — View all submitted applications and their statuses
- 💼 **Browse Jobs** — Explore all available listings with category browsing

### 🏢 Recruiter / Admin
- 🏗️ **Company Management** — Create and configure company profiles with logos
- 📝 **Job Posting** — Post detailed job listings with requirements, salary, and type
- ✏️ **Edit & Delete Jobs** — Full CRUD control over job listings
- 👥 **Applicant Review** — View all applicants for each job with resume access
- 📊 **Status Management** — Update applicant status (Accepted / Rejected / Pending)
- 🔒 **Protected Dashboard** — Role-based access control for recruiter routes

### 🌐 Platform
- 🎨 **Premium Landing Page** — Modern hero section, company slider, category cards, and stats
- 🔐 **JWT Authentication** — Secure login with HTTP-only cookies
- ☁️ **Cloudinary Integration** — Cloud storage for profile photos and resumes
- 📱 **Responsive Design** — Fully mobile-friendly across all screen sizes
- ⚡ **Smooth Animations** — Framer Motion powered transitions throughout

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **Redux Toolkit** | Global state management |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v4** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **Axios** | HTTP client |
| **Shadcn/ui** | UI component library |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |
| **React Markdown** | Render rich job descriptions |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Multer** | File upload middleware |
| **Cloudinary** | Cloud media storage |
| **dotenv** | Environment config |
| **cookie-parser** | Cookie management |

---

## 📁 Project Structure

```
career-connect/
│
├── Client/                          # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/               # Recruiter dashboard pages
│   │   │   │   ├── AdminJobs.jsx
│   │   │   │   ├── AdminJobsTable.jsx
│   │   │   │   ├── Companies.jsx
│   │   │   │   ├── CompanyCreate.jsx
│   │   │   │   ├── CompanySetup.jsx
│   │   │   │   ├── EditJob.jsx
│   │   │   │   ├── JobApplicants.jsx
│   │   │   │   ├── PostJob.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Signup.jsx
│   │   │   ├── shared/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── HeroSection.jsx
│   │   │   ├── Jobs.jsx             # Job listings with filters
│   │   │   ├── JobDescription.jsx   # Job detail page
│   │   │   ├── Profile.jsx          # Student profile page
│   │   │   ├── UpdateProfileDialog.jsx
│   │   │   └── Browse.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── redux/                   # Redux store & slices
│   │   │   ├── store.js
│   │   │   ├── authSlice.js
│   │   │   ├── jobSlice.js
│   │   │   ├── companySlice.js
│   │   │   └── applicationSlice.js
│   │   └── utils/
│   │       ├── constant.js          # API endpoint constants
│   │       └── filterUtils.js       # Job filter logic
│   ├── index.html
│   ├── vercel.json
│   └── vite.config.js
│
├── Server/                          # Express backend
│   ├── controllers/
│   │   ├── user.controllers.js
│   │   ├── job.controllers.js
│   │   ├── company.controllers.js
│   │   └── application.controllers.js
│   ├── middlewares/
│   │   ├── authUser.js              # JWT auth middleware
│   │   └── multer.js                # File upload middleware
│   ├── models/
│   │   ├── user.model.js
│   │   ├── job.models.js
│   │   ├── company.models.js
│   │   └── application.models.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── job.routes.js
│   │   ├── company.routes.js
│   │   └── application.routes.js
│   ├── utils/
│   │   ├── db.js                    # MongoDB cached connection
│   │   ├── cloudinary.js
│   │   └── datauri.js
│   ├── index.js                     # Express app entry point
│   └── vercel.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org) v18+
- [npm](https://npmjs.com) v9+
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster
- A [Cloudinary](https://cloudinary.com) account

### 1. Clone the Repository

```bash
git clone https://github.com/learnervivek/Career-connect..git
cd Career-connect.
```

### 2. Setup the Backend

```bash
cd Server
npm install
```

Create a `.env` file in the `Server/` directory:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=8000
SECRET_KEY=your_jwt_secret_key
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
CLOUDINARY_NAME=your_cloudinary_cloud_name
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

The server runs at `http://localhost:8000`

### 3. Setup the Frontend

```bash
cd ../Client
npm install
```

Create a `.env` file in the `Client/` directory:

```env
VITE_BACKEND_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend (`Server/.env`)

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `SECRET_KEY` | JWT signing secret | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_SECRET_KEY` | Cloudinary API secret | ✅ |
| `CLOUDINARY_NAME` | Cloudinary cloud name | ✅ |
| `FRONTEND_URL` | Allowed frontend origin for CORS | ✅ |
| `NODE_ENV` | `development` or `production` | ✅ |
| `PORT` | Server port (default: 8000) | ❌ |

### Frontend (`Client/.env`)

| Variable | Description | Required |
|---|---|---|
| `VITE_BACKEND_URL` | Backend API base URL | ✅ |

> ⚠️ Never commit `.env` files to version control. They are already listed in `.gitignore`.

---

## 📡 API Reference

### Auth — `/api/v1/user`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/register` | Register a new user | ❌ |
| `POST` | `/login` | Login and get token cookie | ❌ |
| `POST` | `/logout` | Clear auth cookie | ❌ |
| `POST` | `/profile/update` | Update profile info & resume | ✅ |
| `POST` | `/profile/photo` | Update profile photo | ✅ |

### Jobs — `/api/v1/job`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/get` | Get all jobs (with search) | ❌ |
| `GET` | `/getadminjobs` | Get recruiter's posted jobs | ✅ |
| `GET` | `/get/:id` | Get single job details | ❌ |
| `POST` | `/post` | Post a new job | ✅ |
| `PUT` | `/update/:id` | Edit an existing job | ✅ |
| `DELETE` | `/delete/:id` | Delete a job | ✅ |

### Companies — `/api/v1/company`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/register` | Create a new company | ✅ |
| `GET` | `/get` | Get all companies for recruiter | ✅ |
| `GET` | `/get/:id` | Get single company | ✅ |
| `PUT` | `/update/:id` | Update company info | ✅ |

### Applications — `/api/v1/application`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/apply/:id` | Apply to a job | ✅ |
| `GET` | `/get` | Get student's applications | ✅ |
| `GET` | `/getapplicants/:id` | Get applicants for a job | ✅ |
| `PUT` | `/status/:id/update` | Update application status | ✅ |

---

## ☁️ Deployment

Career-Connect is deployed as two separate projects on **Vercel**:

| Service | Platform | Root Directory |
|---|---|---|
| Frontend | Vercel | `Client/` |
| Backend | Vercel (Serverless) | `Server/` |

### Key deployment notes:
- Set `NODE_ENV=production` on the backend — disables `app.listen()` for serverless compatibility
- The backend uses a **cached MongoDB connection** pattern to handle Vercel serverless cold starts efficiently
- MongoDB Atlas must allow connections from **all IPs** (`0.0.0.0/0`) since Vercel uses dynamic IPs
- Both `vercel.json` files are pre-configured — just set environment variables in the Vercel dashboard

For full step-by-step deployment instructions, see [Vercel Deployment Guide](#).

---

## 👥 User Roles

### Student
- Register / Login with `role: student`
- Browse and search jobs
- Apply to jobs and track application status
- Manage profile (photo, resume, bio, skills)

### Recruiter
- Register / Login with `role: recruiter`
- Create and manage company profile
- Post, edit, and delete job listings
- View applicants and update their status

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by [Vivek Kumar](https://github.com/learnervivek)

⭐ Star this repo if you found it helpful!

</div>
