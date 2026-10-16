import React from 'react'
import { Briefcase, BookOpen, Calendar, ShieldCheck } from 'lucide-react'

const stats = [
    {
        label: 'Top Companies Prepared',
        value: '15+',
        icon: BookOpen,
        sub: 'TCS, Infosys, Google, Amazon & more',
    },
    {
        label: 'Verified Job Opportunities',
        value: '500+',
        icon: Briefcase,
        sub: 'Full salary transparency',
    },
    {
        label: 'Interview Coordination',
        value: '1-Click',
        icon: Calendar,
        sub: 'Google Meet, Zoom & in-person',
    },
    {
        label: 'Free for Candidates',
        value: '100%',
        icon: ShieldCheck,
        sub: 'Zero hidden fees forever',
    },
]

const CareerStats = () => {
    return (
        <section className="py-14 bg-white border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {stats.map((item) => {
                        const Icon = item.icon
                        return (
                            <div
                                key={item.label}
                                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl text-center sm:text-left hover:bg-gray-50/80 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                        {item.value}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-800 mt-0.5">
                                        {item.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {item.sub}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default CareerStats
