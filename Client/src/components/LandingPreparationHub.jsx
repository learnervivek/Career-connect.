import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { PREPARATION_API_END_POINT } from '@/utils/constant'
import {
    Sparkles,
    Building2,
    BookOpen,
    ArrowRight,
    CheckCircle2,
    Layers,
    Compass,
    AlertCircle,
    RefreshCw,
} from 'lucide-react'

const getInitials = (name) => {
    if (!name) return 'CO'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

const LandingPreparationHub = () => {
    const navigate = useNavigate()
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState('All')

    const fetchCompanies = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await axios.get(`${PREPARATION_API_END_POINT}/companies`, {
                withCredentials: true,
            })
            if (res.data.success) {
                setCompanies(res.data.companies || [])
            } else {
                setError(res.data.message || 'Failed to load companies')
            }
        } catch (err) {
            console.error('Error fetching preparation companies for landing page:', err)
            setError(err.response?.data?.message || 'Failed to load company preparation catalog')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    const filteredCompanies = companies.filter((c) => {
        if (selectedCategory === 'All') return true
        return c.category === selectedCategory
    })

    // Curated top 6 for clean visual landing presentation
    const displayCompanies = filteredCompanies.slice(0, 6)

    return (
        <section className="py-20 bg-gray-50/70 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                            <span>Company Preparation Hub</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Company-Wise Placement Preparation
                        </h2>
                        <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
                            Master recruitment rounds for India's leading tech employers and global product giants with verified syllabi, structured stages, and topic-level curated resources.
                        </p>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                        {['All', 'Product & Technology', 'IT Services & Consulting'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    selectedCategory === cat
                                        ? 'bg-[#6A38C2] text-white shadow-xs'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-6 border border-gray-200/80 animate-pulse space-y-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                                        <div className="h-3 bg-gray-200 rounded-md w-1/2" />
                                    </div>
                                </div>
                                <div className="h-12 bg-gray-100 rounded-md" />
                                <div className="h-9 bg-gray-200 rounded-xl" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="bg-white rounded-2xl p-8 border border-red-100 text-center max-w-lg mx-auto shadow-xs">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Unable to load company catalog</h4>
                        <p className="text-xs text-gray-500 mb-4">{error}</p>
                        <button
                            type="button"
                            onClick={fetchCompanies}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && displayCompanies.length === 0 && (
                    <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                        <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-gray-800">No companies found in this category</h4>
                        <p className="text-xs text-gray-500 mt-1">Try switching to 'All' to view all available company roadmaps.</p>
                    </div>
                )}

                {/* Companies Grid */}
                {!loading && !error && displayCompanies.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayCompanies.map((comp) => {
                            const roadmapsCount = comp.roadmapsCount ?? (comp.roadmaps?.length || 0)
                            const isProduct = comp.category === 'Product & Technology'

                            return (
                                <div
                                    key={comp._id || comp.slug}
                                    className="group bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs hover:border-[#6A38C2]/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                                >
                                    {/* Category Accent top bar */}
                                    <div
                                        className={`absolute top-0 left-0 right-0 h-1 ${
                                            isProduct ? 'bg-purple-500' : 'bg-blue-500'
                                        }`}
                                    />

                                    <div>
                                        {/* Card Top: Logo, Name, Category */}
                                        <div className="flex items-start gap-3.5 mb-4">
                                            <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:border-purple-200 transition-colors p-2">
                                                {comp.logo ? (
                                                    <img
                                                        src={comp.logo}
                                                        alt={comp.companyName}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                            e.currentTarget.parentElement.innerHTML = `<span class="text-[#6A38C2] font-bold text-base">${getInitials(
                                                                comp.companyName
                                                            )}</span>`
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-[#6A38C2] font-bold text-base">
                                                        {getInitials(comp.companyName)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h3
                                                        onClick={() =>
                                                            navigate(`/preparation/companies/${comp.slug || comp._id}`)
                                                        }
                                                        className="font-bold text-gray-900 group-hover:text-[#6A38C2] cursor-pointer transition-colors truncate text-base"
                                                        title={comp.companyName}
                                                    >
                                                        {comp.companyName}
                                                    </h3>
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                    <span
                                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                            isProduct
                                                                ? 'text-purple-700 bg-purple-50'
                                                                : 'text-blue-700 bg-blue-50'
                                                        }`}
                                                    >
                                                        {comp.category}
                                                    </span>
                                                    {comp.tier && (
                                                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {comp.tier}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                                            {comp.description || 'Structured recruitment tracks and preparation curricula.'}
                                        </p>

                                        {/* Roadmaps Count & Hiring Tracks */}
                                        <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-1.5 text-purple-700 font-semibold">
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>{roadmapsCount} {roadmapsCount === 1 ? 'Roadmap' : 'Roadmaps'}</span>
                                            </div>
                                            <span className="text-gray-500 font-medium">
                                                {comp.hiringTracks?.length || 0} Hiring Tracks
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/preparation/companies/${comp.slug || comp._id}`)}
                                        className="w-full bg-white hover:bg-purple-50 text-gray-900 hover:text-purple-700 border border-gray-200 group-hover:border-purple-300 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                    >
                                        <span>Explore Roadmaps</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Bottom View All Action */}
                <div className="mt-12 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/preparation')}
                        className="inline-flex items-center gap-2 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold px-7 py-3 rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer"
                    >
                        <Compass className="w-4 h-4" />
                        <span>Explore All 15 Company Roadmaps</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                        TCS, Infosys, Wipro, Google, Microsoft, Amazon, Oracle, Zoho, and more.
                    </p>
                </div>
            </div>
        </section>
    )
}

export default LandingPreparationHub
