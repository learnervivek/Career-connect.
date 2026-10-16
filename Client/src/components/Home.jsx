import React, { useEffect } from 'react'
import Navbar from './shared/Navbar'
import HeroSection from './HeroSection'
import CompanySlider from './CompanySlider'
import LandingPreparationHub from './LandingPreparationHub'
import LandingInterviewSection from './LandingInterviewSection'
import CategorySection from './CategorySection'
import LatestJobs from './LatestJobs'
import LandingCandidateDashboardPreview from './LandingCandidateDashboardPreview'
import LandingRecruiterSection from './LandingRecruiterSection'
import PlatformFeatures from './PlatformFeatures'
import HowItWorks from './HowItWorks'
import CareerStats from './CareerStats'
import CtaBanner from './CtaBanner'
import Footer from './shared/Footer'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const navigate = useNavigate()
    useGetAllJobs()
    const { user } = useSelector((store) => store.auth)

    useEffect(() => {
        if (user?.role === 'recruiter') {
            navigate('/admin/companies')
        }
    }, [user, navigate])

    return (
        <div className="min-h-screen bg-white flex flex-col antialiased selection:bg-purple-100 selection:text-purple-900">
            <Navbar />
            <main className="flex-1">
                {/* 1. Hero Section: Unified headline, dual search & CTAs */}
                <HeroSection />

                {/* 2. Top Hiring Companies Marquee Slider */}
                <CompanySlider />

                {/* 3. Company Preparation Hub: Dynamic placement tracks for 15+ top companies */}
                <LandingPreparationHub />

                {/* 4. Integrated Interview Coordination: Timeline & capability showcase */}
                <LandingInterviewSection />

                {/* 5. Job Categories */}
                <CategorySection />

                {/* 6. Job Search & Application Tracking: Real verified opportunities */}
                <LatestJobs />

                {/* 7. Personalized Candidate Command Center Preview */}
                <LandingCandidateDashboardPreview />

                {/* 8. Recruiter & Hiring Teams Suite */}
                <LandingRecruiterSection />

                {/* 9. Unified Platform Capabilities: 4 Pillars */}
                <PlatformFeatures />

                {/* 10. End-to-End Candidate Journey: 5 Phases */}
                <HowItWorks />

                {/* 11. Career Stats & Platform Trust Metrics */}
                <CareerStats />

                {/* 12. Final Call-to-Action Banner */}
                <CtaBanner />
            </main>
            <Footer />
        </div>
    )
}

export default Home
