import React from 'react';
import Navbar from './shared/Navbar';
import Footer from './shared/Footer';
import CandidateInterviews from './CandidateInterviews';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const CandidateInterviewsPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
            <Navbar />
            <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#6A38C2] text-white flex items-center justify-center shadow-xs">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Interviews</h1>
                            <p className="text-sm text-gray-500">
                                Track scheduled interview rounds, confirm invitations, join video calls, and communicate with recruiters.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 sm:p-8">
                    <CandidateInterviews />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CandidateInterviewsPage;
