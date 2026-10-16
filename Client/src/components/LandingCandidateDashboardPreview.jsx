import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    LayoutDashboard,
    Target,
    BookOpen,
    CheckCircle2,
    Calendar,
    Bookmark,
    ArrowRight,
    Sparkles,
    Briefcase,
    TrendingUp,
    Clock,
} from 'lucide-react'

const LandingCandidateDashboardPreview = () => {
    const navigate = useNavigate()
    const { user } = useSelector((store) => store.auth)

    const handleDashboardClick = () => {
        if (!user) {
            navigate('/login')
        } else {
            navigate('/my-preparation')
        }
    }

    return (
        <section className="py-20 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                        <span>Personalized Candidate Experience</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Your Personal Career & Preparation Command Center
                    </h2>

                    <p className="text-sm sm:text-base text-gray-500 mt-2.5 leading-relaxed">
                        Stay focused and organized. Track your target companies, monitor topic-level roadmap progress, bookmark high-yield study resources, and manage scheduled interviews in one cohesive workspace.
                    </p>
                </div>

                {/* Dashboard Showcase Preview Mockup */}
                <div className="bg-gradient-to-br from-gray-900 via-[#1a0f2e] to-[#2b1055] rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F83002]/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Preview Topbar */}
                    <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-8 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base sm:text-lg text-white">
                                    Candidate Preparation Dashboard
                                </h3>
                                <p className="text-xs text-purple-200/70">
                                    Unified Progress • Target Companies • Active Roadmaps • Scheduled Rounds
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Synchronized With Cloud Progress
                            </span>
                        </div>
                    </div>

                    {/* 4 Feature Cards Grid Mockup */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {/* 1. Target Companies Card */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-purple-300 text-xs font-semibold">
                                <span className="flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-purple-400" />
                                    Target Companies
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                                    3 Active
                                </span>
                            </div>

                            <div className="space-y-2 pt-1 text-xs">
                                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <span className="font-semibold text-white">Google</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                                        Dream
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <span className="font-semibold text-white">TCS (Prime)</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-bold">
                                        High
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Active Roadmap Progress */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-purple-300 text-xs font-semibold">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                    Active Roadmap
                                </span>
                                <span className="text-emerald-300 font-bold">64% Done</span>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-white truncate">
                                    TCS Digital & Prime Track
                                </h4>
                                <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-purple-400 to-emerald-400 h-2 rounded-full"
                                        style={{ width: '64%' }}
                                    />
                                </div>
                                <p className="text-[11px] text-purple-200/60 mt-1.5">
                                    Next: Dynamic Programming on Trees
                                </p>
                            </div>
                        </div>

                        {/* 3. Upcoming Interview */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-purple-300 text-xs font-semibold">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-purple-400" />
                                    Next Interview
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                    Confirmed
                                </span>
                            </div>

                            <div className="pt-1">
                                <h4 className="text-sm font-bold text-white">
                                    Technical Architecture
                                </h4>
                                <p className="text-xs text-purple-200/80 mt-1 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-purple-400" />
                                    <span>Tomorrow, 2:30 PM (Google Meet)</span>
                                </p>
                            </div>
                        </div>

                        {/* 4. Saved Resources */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-purple-300 text-xs font-semibold">
                                <span className="flex items-center gap-1.5">
                                    <Bookmark className="w-4 h-4 text-purple-400" />
                                    Saved Resources
                                </span>
                                <span className="text-xs text-purple-200 font-bold">5 Items</span>
                            </div>

                            <div className="space-y-1.5 pt-1 text-xs">
                                <div className="text-white truncate font-medium">
                                    • NeetCode 150 Blind Sheet
                                </div>
                                <div className="text-white truncate font-medium">
                                    • System Design Primer Docs
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard CTA */}
                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={handleDashboardClick}
                            className="bg-white text-[#431B7D] hover:bg-purple-50 font-bold px-7 py-3 rounded-xl shadow-lg transition-all cursor-pointer text-xs sm:text-sm inline-flex items-center gap-2 group"
                        >
                            <span>
                                {user ? 'Go to My Preparation Dashboard' : 'Sign Up to Track Your Preparation'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default LandingCandidateDashboardPreview
