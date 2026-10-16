import React from 'react'
import {
    Search,
    BookOpen,
    Send,
    Calendar,
    Activity,
    ArrowRight,
    Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const workflowSteps = [
    {
        step: '01',
        title: 'Discover',
        desc: 'Explore verified job opportunities filtered by tech stack, transparent salary, and location.',
        icon: Search,
        badge: 'Job Search',
    },
    {
        step: '02',
        title: 'Prepare',
        desc: 'Select your target companies and master placement rounds with structured syllabus roadmaps.',
        icon: BookOpen,
        badge: 'Placement Hub',
    },
    {
        step: '03',
        title: 'Apply',
        desc: 'Submit your profile and formatted resume with 1-click fast apply directly to verified employers.',
        icon: Send,
        badge: '1-Click Apply',
    },
    {
        step: '04',
        title: 'Interview',
        desc: 'Receive direct interview invites, confirm availability or request rescheduling, and join video rounds.',
        icon: Calendar,
        badge: 'Coordination',
    },
    {
        step: '05',
        title: 'Track',
        desc: 'Monitor application status milestones, preparation completion rates, and notifications in real time.',
        icon: Activity,
        badge: 'Pipeline',
    },
]

const HowItWorks = () => {
    const navigate = useNavigate()
    const { user } = useSelector((store) => store.auth)

    return (
        <section className="py-20 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                        <span>The Candidate Journey</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                        How Career Connect Works
                    </h2>

                    <p className="text-sm sm:text-base text-gray-500 mt-2 leading-relaxed">
                        A clear, structured pathway designed to guide ambitious candidates from skill preparation to job discovery and interview execution.
                    </p>
                </div>

                {/* 5-Step Flow Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
                    {workflowSteps.map((item, idx) => {
                        const Icon = item.icon
                        return (
                            <div
                                key={item.step}
                                className="relative bg-gray-50/70 hover:bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-purple-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold group-hover:bg-[#6A38C2] group-hover:text-white transition-colors duration-200">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xl font-black text-gray-200 group-hover:text-purple-200 transition-colors">
                                            {item.step}
                                        </span>
                                    </div>

                                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold mb-2">
                                        {item.badge}
                                    </div>

                                    <h3 className="text-base font-bold text-gray-900 mb-2">
                                        {item.title}
                                    </h3>

                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>

                                <div className="mt-6 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs font-semibold text-purple-700">
                                    <span>Phase {idx + 1} of 5</span>
                                    {idx < 4 && (
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-12 text-center">
                    <button
                        type="button"
                        onClick={() => navigate(user ? '/jobs' : '/signup')}
                        className="inline-flex items-center gap-2 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold px-7 py-3 rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer"
                    >
                        <span>{user ? 'Explore Opportunities & Prep Hub' : 'Start Your Career Journey For Free'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default HowItWorks
