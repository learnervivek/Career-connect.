import React from 'react';
import { Briefcase, Calendar, CheckCircle2, Sparkles, Star } from 'lucide-react';

const AuthSidePanel = ({ mode = 'login' }) => {
    const isLogin = mode === 'login';

    const items = [
        {
            title: 'Verified Job Opportunities',
            desc: 'Vetted roles at top MNCs & high-growth startups with direct recruiter outreach.',
            icon: Briefcase,
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        },
        {
            title: 'Live Tracking & Notifications',
            desc: 'Transparent milestones, recruiter notes, and real-time status updates.',
            icon: CheckCircle2,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
        {
            title: 'Interview Coordination & Prep',
            desc: 'Unified schedule management with company-specific roadmap guides.',
            icon: Calendar,
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        },
    ];

    return (
        <div className="relative hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 m-2 xl:m-2.5 p-6 xl:p-8">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header Brand */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/20 backdrop-blur-md">
                        <Sparkles className="w-3 h-3 text-[#F83002]" />
                        {isLogin ? 'Welcome Back' : 'Join the Network'}
                    </span>
                </div>
                <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Your Gateway to <br />
                    <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                        Exceptional Careers
                    </span>
                </h2>
                <p className="mt-2 text-xs xl:text-sm text-slate-300 max-w-sm leading-relaxed">
                    Connecting candidates with top employers through transparent tracking, interview coordination, and company roadmaps.
                </p>
            </div>

            {/* Value Propositions Cards */}
            <div className="relative z-10 my-3.5 space-y-2">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-start gap-3 p-2.5 xl:p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors duration-200"
                    >
                        <div className={`p-1.5 xl:p-2 rounded-xl shrink-0 border ${item.color}`}>
                            <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs xl:text-sm font-semibold text-white">{item.title}</h4>
                            <p className="text-[11px] xl:text-xs text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Testimonial / Social Proof */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-gradient-to-tr from-purple-500 to-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
                            AK
                        </div>
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-gradient-to-tr from-emerald-500 to-teal-500 text-[9px] font-bold text-white flex items-center justify-center">
                            RV
                        </div>
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-gradient-to-tr from-rose-500 to-orange-500 text-[9px] font-bold text-white flex items-center justify-center">
                            SP
                        </div>
                    </div>
                    <span className="font-medium text-slate-300 text-[11px]">10,000+ candidates placed</span>
                </div>

                <div className="flex items-center gap-1 text-amber-300 text-[11px]">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span className="font-semibold text-white">4.9/5</span>
                </div>
            </div>
        </div>
    );
};

export default AuthSidePanel;
