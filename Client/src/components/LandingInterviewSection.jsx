import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    Calendar,
    Clock,
    Video,
    CheckCircle2,
    RotateCcw,
    Bell,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    FileText,
    Users,
    Check,
} from 'lucide-react'

const supportedWorkflow = [
    {
        step: '1',
        title: 'Application Submitted',
        desc: 'Candidate submits profile & resume with 1-click.',
        icon: FileText,
        badge: 'Step 1',
    },
    {
        step: '2',
        title: 'Shortlisted & Accepted',
        desc: 'Recruiter reviews qualifications and accepts applicant.',
        icon: Users,
        badge: 'Step 2',
    },
    {
        step: '3',
        title: 'Interview Scheduled',
        desc: 'Recruiter sets date, time, round type, and meeting link.',
        icon: Calendar,
        badge: 'Step 3',
    },
    {
        step: '4',
        title: 'Candidate Confirmation',
        desc: 'Candidate confirms attendance or requests rescheduling.',
        icon: RotateCcw,
        badge: 'Step 4',
    },
    {
        step: '5',
        title: 'Interview Completed',
        desc: 'Rounds conducted with clear status feedback.',
        icon: CheckCircle2,
        badge: 'Step 5',
    },
]

const LandingInterviewSection = () => {
    const navigate = useNavigate()
    const { user } = useSelector((store) => store.auth)

    const handleActionClick = () => {
        if (!user) {
            navigate('/login')
        } else if (user.role === 'recruiter') {
            navigate('/admin/interviews')
        } else {
            navigate('/interviews')
        }
    }

    return (
        <section className="py-20 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                        <span>Integrated Interview Coordination</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        From Application to Interview, All in One Place
                    </h2>

                    <p className="text-sm sm:text-base text-gray-500 mt-2.5 leading-relaxed">
                        Say goodbye to disjointed email chains and scheduling mix-ups. Career Connect coordinates interviews directly between candidates and hiring teams with live video links, status tracking, and 1-click confirmations.
                    </p>
                </div>

                {/* Workflow Timeline */}
                <div className="mb-16">
                    <div className="text-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                            End-to-End Interview Workflow
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                        {supportedWorkflow.map((item, idx) => {
                            const Icon = item.icon
                            return (
                                <div
                                    key={item.step}
                                    className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 hover:border-purple-300 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between group relative"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-[#6A38C2] group-hover:text-white transition-colors flex items-center justify-center font-bold text-sm">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-black text-gray-300 group-hover:text-purple-300 transition-colors">
                                                0{idx + 1}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-bold text-gray-900 mb-1">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>

                                    {idx < 4 && (
                                        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-gray-300 pointer-events-none">
                                            <ArrowRight className="w-4 h-4 text-purple-300" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Interactive Capability Showcase Banner */}
                <div className="bg-gradient-to-br from-purple-50 via-white to-orange-50/40 rounded-3xl p-6 sm:p-8 lg:p-10 border border-purple-100 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Left: Capability points */}
                        <div className="lg:col-span-7 space-y-4">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Seamless Coordination for Candidates & Recruiters
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong>Recruiter Scheduling:</strong> Set rounds (Technical, Coding, HR) with custom meeting links.</span>
                                </div>

                                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong>Candidate Rescheduling:</strong> Request new dates with reason and proposed time slots.</span>
                                </div>

                                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong>Conflict Prevention:</strong> Double-booking protection detects overlapping scheduled rounds.</span>
                                </div>

                                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong>In-App & Email Alerts:</strong> Receive notifications when rounds are scheduled or rescheduled.</span>
                                </div>
                            </div>

                            <div className="pt-3 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleActionClick}
                                    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer text-xs sm:text-sm flex items-center gap-2"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {user?.role === 'recruiter'
                                            ? 'Open Recruiter Interview Desk'
                                            : user
                                            ? 'View My Scheduled Interviews'
                                            : 'Explore Interview System'}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Right: Mockup Interview Invite Card (No real private user data) */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-md space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                                        Round 2: Technical Deep Dive
                                    </span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Scheduled
                                    </span>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">
                                        Distributed Systems & Coding
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Senior Software Engineer Position
                                    </p>
                                </div>

                                <div className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Tomorrow, 2:30 PM • 60 Minutes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Video className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Google Meet (Secure Link Provided)</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <div className="flex-1 py-1.5 px-3 rounded-lg bg-purple-50 text-purple-700 font-semibold text-xs text-center border border-purple-200">
                                        ✓ 1-Click Confirmation
                                    </div>
                                    <div className="flex-1 py-1.5 px-3 rounded-lg bg-gray-100 text-gray-600 font-medium text-xs text-center">
                                        Request Reschedule
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default LandingInterviewSection
