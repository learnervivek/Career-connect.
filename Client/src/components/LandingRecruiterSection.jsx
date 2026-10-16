import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    Briefcase,
    Users,
    Calendar,
    FileCheck,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Building2,
    BarChart3,
    Bell,
    ShieldCheck,
} from 'lucide-react'

const recruiterFeatures = [
    {
        title: 'Post & Manage Opportunities',
        desc: 'Publish verified job openings with upfront salary bands, required qualifications, and location transparency.',
        icon: Briefcase,
    },
    {
        title: 'Review Applicants & Resumes',
        desc: 'Screen candidate submissions, view contact credentials, and download formatted resumes directly from your portal.',
        icon: Users,
    },
    {
        title: 'Live Application Status Pipeline',
        desc: 'Transition candidates across status stages (Pending, Accepted, Rejected) with instant feedback notifications.',
        icon: FileCheck,
    },
    {
        title: 'Direct Interview Scheduling',
        desc: 'Schedule Technical, Coding, and HR rounds with video links, avoiding conflicting slots and double-bookings.',
        icon: Calendar,
    },
    {
        title: 'Instant Applicant Alerts',
        desc: 'Stay informed in real time when ambitious candidates apply, confirm interview slots, or request rescheduling.',
        icon: Bell,
    },
    {
        title: 'Scam-Free Verified Employer Status',
        desc: 'Recruiter verification ensures trust, helping you attract higher quality technical candidates.',
        icon: ShieldCheck,
    },
]

const LandingRecruiterSection = () => {
    const navigate = useNavigate()
    const { user } = useSelector((store) => store.auth)

    const handleRecruiterAction = () => {
        if (user && user.role === 'recruiter') {
            navigate('/admin/jobs')
        } else if (user) {
            navigate('/admin/jobs')
        } else {
            navigate('/signup')
        }
    }

    return (
        <section className="py-20 bg-gray-50/60 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                        <span>For Hiring Teams & Recruiters</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Hire Faster with Direct Candidate Access
                    </h2>

                    <p className="text-sm sm:text-base text-gray-500 mt-2.5 leading-relaxed">
                        Career Connect gives recruiters the tools to post jobs, review applicants, update statuses, and coordinate interview rounds without third-party friction or cluttered inboxes.
                    </p>
                </div>

                {/* 6 Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {recruiterFeatures.map((feat) => {
                        const Icon = feat.icon
                        return (
                            <div
                                key={feat.title}
                                className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mb-2">
                                        {feat.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                                        {feat.desc}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Bottom Recruiter Action Banner */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div className="w-12 h-12 rounded-2xl bg-[#6A38C2] text-white flex items-center justify-center shrink-0 hidden sm:flex">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-base sm:text-lg font-bold text-gray-900">
                                Ready to build your engineering team?
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Create your verified recruiter account and publish your first role in minutes.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleRecruiterAction}
                        className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer text-xs sm:text-sm flex items-center gap-2 shrink-0"
                    >
                        <span>{user?.role === 'recruiter' ? 'Go to Recruiter Dashboard' : 'Post a Verified Job'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default LandingRecruiterSection
