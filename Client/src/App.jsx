
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Home from './components/Home'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import CandidateInterviewsPage from './components/CandidateInterviewsPage'
import JobDescription from './components/JobDescription'
import CompanyPreparationPage from './components/preparation/CompanyPreparationPage'
import CompanyDetailsPage from './components/preparation/CompanyDetailsPage'
import RoadmapDetailsPage from './components/preparation/RoadmapDetailsPage'
import MyPreparationDashboard from './components/preparation/MyPreparationDashboard'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from './components/admin/AdminJobs'
import PostJob from './components/admin/PostJob'
import JobApplicants from './components/admin/JobApplicants'
import EditJob from './components/admin/EditJob'
import RecruiterInterviews from './components/admin/RecruiterInterviews'
import AdminPreparationDashboard from './components/admin/preparation/AdminPreparationDashboard'
import ProtectedRoute from './components/admin/ProtectedRoute'

const appRouter = createBrowserRouter([

  // for student role


  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: "/jobs",
    element: <Jobs />
  },
  {
    path: "/description/:id",
    element: <JobDescription />
  },
  {
    path: "/browse",
    element: <Browse />
  },
  {
    path: "/profile",
    element: <Profile />
  },
  {
    path: "/interviews",
    element: <CandidateInterviewsPage />
  },
  {
    path: "/preparation",
    element: <CompanyPreparationPage />
  },
  {
    path: "/preparation/companies/:slugOrId",
    element: <CompanyDetailsPage />
  },
  {
    path: "/preparation/roadmaps/:slugOrId",
    element: <RoadmapDetailsPage />
  },
  {
    path: "/preparation/dashboard",
    element: <MyPreparationDashboard />
  },
  {
    path: "/my-preparation",
    element: <MyPreparationDashboard />
  },


  // for admin role
  {
    path: "/admin/companies",
    element: <ProtectedRoute><Companies /></ProtectedRoute>
  },
  {
    path: "/admin/companies/create",
    element: <ProtectedRoute><CompanyCreate /></ProtectedRoute>
  },
  {
    path: "/admin/companies/:id",
    element: <ProtectedRoute><CompanySetup /></ProtectedRoute>
  },
  {
    path: "/admin/jobs",
    element: <ProtectedRoute><AdminJobs /></ProtectedRoute>
  },
  {
    path: "/admin/jobs/create",
    element: <ProtectedRoute><PostJob /></ProtectedRoute>
  },
  {
    path: "/admin/jobs/:id",
    element: <ProtectedRoute><EditJob /></ProtectedRoute>
  },
  {
    path: "/admin/jobs/:id/applicants",
    element: <ProtectedRoute><JobApplicants /></ProtectedRoute>
  },
  {
    path: "/admin/interviews",
    element: <ProtectedRoute><RecruiterInterviews /></ProtectedRoute>
  },
  {
    path: "/admin/preparation",
    element: <ProtectedRoute><AdminPreparationDashboard /></ProtectedRoute>
  },



])

function App() {


  return (
    <>
      <RouterProvider router={appRouter} />
    </>
  )
}

export default App
