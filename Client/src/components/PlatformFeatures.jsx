import React from 'react'
import {
    Briefcase,
    BookOpen,
    Calendar,
    Building2,
    CheckCircle2,
    Search,
    ShieldCheck,
    Layers,
    RotateCcw,
    Bell,
    FileCheck,
    FileText,
} from 'lucide-react'

const featureCategories = [
    {
        category: 'Job Discovery',
        icon: Briefcase,
        color: 'from-blue-500/10 to-blue-600/10 text-blue-700',
        badge: 'Verified Opportunities',
        items: [
            'Search & smart filters by salary, tech stack, and location',
            'Full salary transparency with zero hidden compensation',
            '1-Click quick application with resume and profile upload',
            'Real-time application status tracking without ghost listings',
        ],
    },
    {
        category: 'Company Preparation',
        icon: BookOpen,
        color: 'from-purple-500/10 to-purple-600/10 text-purple-700',
        badge: '15+ Top Companies',
        items: [
            'Company-specific roadmaps for TCS, Infosys, Google, Amazon, etc.',
            'Role tracks for software engineering, cloud, and specialist roles',
            'Topic-level curated learning resources with direct external links',
            'Persistent topic completion progress & target company manager',
        ],
    },
    {
        category: 'Interview Coordination',
        icon: Calendar,
        color: 'from-emerald-500/10 to-emerald-600/10 text-emerald-700',
        badge: 'Integrated Scheduling',
        items: [
            'Direct interview invitations with Google Meet / Zoom links',
            'Candidate 1-click confirmation or rescheduling requests',
            'Round-by-round tracking (Technical, Coding, HR, Final)',
            'Instant in-app alerts and email notifications on scheduling updates',
        ],
    },
    {
        category: 'Recruitment Management',
        icon: Building2,
        color: 'from-amber-500/10 to-amber-600/10 text-amber-700',
        badge: 'For Hiring Teams',
        items: [
            'Post and manage technical job openings with transparent criteria',
            'Review candidate profiles and download formatted resumes',
            'Progress applicants across Pending, Accepted, and Rejected stages',
            'Coordinate multi-round interviews with conflict prevention',
        ],
    },
]

const PlatformFeatures = () => {
    return (
        <section className="py-20 bg-gray-50/60 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-3">
                        <span>Unified Capabilities</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Everything You Need in One Unified Career Platform
                    </h2>

                    <p className="text-sm sm:text-base text-gray-500 mt-2.5 leading-relaxed">
                        Career Connect combines job search, company-specific preparation curricula, and interview management into a single, cohesive ecosystem.
                    </p>
                </div>

                {/* 4 Category Pillar Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {featureCategories.map((pillar) => {
                        const Icon = pillar.icon
                        return (
                            <div
                                key={pillar.category}
                                className="bg-white rounded-3xl p-7 sm:p-8 border border-gray-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.color} flex items-center justify-center`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                                            {pillar.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        {pillar.category}
                                    </h3>

                                    <ul className="space-y-3">
                                        {pillar.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default PlatformFeatures
