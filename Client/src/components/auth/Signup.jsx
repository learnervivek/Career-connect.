import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '@/redux/authSlice';
import {
    Loader2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    Briefcase,
    Phone,
    UploadCloud,
    X,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import AuthSidePanel from './AuthSidePanel';

const Signup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, user } = useSelector(store => store.auth);

    const [input, setInput] = useState({
        fullname: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'student', // Default to Candidate (never admin)
        file: null,
    });

    const [filePreview, setFilePreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    // Password strength calculation
    const calculatePasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pass.length >= 6) score += 1;
        if (pass.length >= 8) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
        if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
        if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' };
        return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
    };

    const passwordStrength = calculatePasswordStrength(input.password);

    // Field-level validation
    const validateField = (name, value, allInputs = input) => {
        let error = '';
        if (name === 'fullname') {
            if (!value.trim()) {
                error = 'Required.';
            } else if (value.trim().length < 2) {
                error = 'Min. 2 chars.';
            }
        }
        if (name === 'email') {
            if (!value.trim()) {
                error = 'Required.';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                error = 'Invalid email.';
            }
        }
        if (name === 'phoneNumber') {
            const digits = value.replace(/\D/g, '');
            if (!value.trim()) {
                error = 'Required.';
            } else if (digits.length < 10) {
                error = '10 digits required.';
            }
        }
        if (name === 'password') {
            if (!value) {
                error = 'Required.';
            } else if (value.length < 6) {
                error = 'Min. 6 chars.';
            }
        }
        if (name === 'confirmPassword') {
            if (!value) {
                error = 'Required.';
            } else if (value !== allInputs.password) {
                error = 'Mismatch.';
            }
        }
        if (name === 'role') {
            if (!value || (value !== 'student' && value !== 'recruiter')) {
                error = 'Select role.';
            }
        }
        return error;
    };

    const changeEventHandler = (e) => {
        const { name, value } = e.target;
        const updated = { ...input, [name]: value };
        setInput(updated);
        setServerError('');

        if (touched[name]) {
            const error = validateField(name, value, updated);
            setFormErrors(prev => ({ ...prev, [name]: error }));
        }

        if (name === 'password' && touched.confirmPassword) {
            const confirmErr = validateField('confirmPassword', input.confirmPassword, updated);
            setFormErrors(prev => ({ ...prev, confirmPassword: confirmErr }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value, input);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    const selectRole = (selectedRole) => {
        setInput(prev => ({ ...prev, role: selectedRole }));
        setServerError('');
        if (touched.role) {
            setFormErrors(prev => ({ ...prev, role: '' }));
        }
    };

    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be under 5MB.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, WEBP).');
            return;
        }

        setInput(prev => ({ ...prev, file }));
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
    };

    const removeFile = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setInput(prev => ({ ...prev, file: null }));
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setServerError('');

        const errors = {
            fullname: validateField('fullname', input.fullname),
            email: validateField('email', input.email),
            phoneNumber: validateField('phoneNumber', input.phoneNumber),
            password: validateField('password', input.password),
            confirmPassword: validateField('confirmPassword', input.confirmPassword),
            role: validateField('role', input.role),
        };

        setTouched({
            fullname: true,
            email: true,
            phoneNumber: true,
            password: true,
            confirmPassword: true,
            role: true,
        });
        setFormErrors(errors);

        if (Object.values(errors).some(Boolean)) {
            toast.error('Please resolve the highlighted errors.');
            return;
        }

        const formData = new FormData();
        formData.append('fullname', input.fullname.trim());
        formData.append('email', input.email.trim());
        formData.append('phoneNumber', input.phoneNumber.trim());
        formData.append('password', input.password);
        formData.append('role', input.role);
        if (input.file) {
            formData.append('file', input.file);
        }

        try {
            dispatch(setLoading(true));
            const response = await axios.post(`${USER_API_END_POINT}/register`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Account created successfully! Please log in.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Registration error:', error);
            const message = error.response?.data?.message || 'Unable to register. Please try again.';
            setServerError(message);
            toast.error(message);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim());
    const isPasswordMatch = input.confirmPassword && input.password === input.confirmPassword;

    return (
        <div className="h-screen max-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-y-auto lg:overflow-hidden">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-4 min-h-0">
                <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-purple-500/5 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col lg:flex-row my-auto">
                    
                    {/* Left Brand Showcase Panel */}
                    <AuthSidePanel mode="signup" />

                    {/* Right Form Card */}
                    <div className="w-full lg:w-1/2 p-5 sm:p-7 xl:p-8 flex flex-col justify-between">
                        <div>
                            {/* Header */}
                            <div className="mb-3">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-[#6A38C2] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 mb-1.5">
                                    <ShieldCheck className="w-3 h-3 text-[#6A38C2]" />
                                    <span>Fast & Free Registration</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Create Your Account
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    Join Career Connect to explore verified roles and track applications.
                                </p>
                            </div>

                            {/* Server Error Banner */}
                            {serverError && (
                                <div 
                                    role="alert" 
                                    className="mb-2.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-2 text-xs animate-in fade-in duration-200"
                                >
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-semibold uppercase tracking-wider text-[10px]">Registration Failed</p>
                                        <p className="mt-0.5">{serverError}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submitHandler} noValidate className="space-y-2.5">
                                {/* Role Selection Pills */}
                                <div>
                                    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Account role">
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={input.role === 'student'}
                                            onClick={() => selectRole('student')}
                                            className={`relative flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                                input.role === 'student'
                                                    ? 'border-[#6A38C2] bg-purple-50/70 dark:bg-purple-950/40 ring-1.5 ring-purple-500/20 text-[#6A38C2] dark:text-purple-300'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg shrink-0 ${
                                                input.role === 'student' ? 'bg-[#6A38C2] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate">Candidate</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Job seeker / student</p>
                                            </div>
                                            {input.role === 'student' && (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[#6A38C2] dark:text-purple-400 absolute top-1.5 right-1.5" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={input.role === 'recruiter'}
                                            onClick={() => selectRole('recruiter')}
                                            className={`relative flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                                input.role === 'recruiter'
                                                    ? 'border-[#6A38C2] bg-purple-50/70 dark:bg-purple-950/40 ring-1.5 ring-purple-500/20 text-[#6A38C2] dark:text-purple-300'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg shrink-0 ${
                                                input.role === 'recruiter' ? 'bg-[#6A38C2] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                <Briefcase className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate">Recruiter</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Hiring & company</p>
                                            </div>
                                            {input.role === 'recruiter' && (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[#6A38C2] dark:text-purple-400 absolute top-1.5 right-1.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Row 1: Full Name & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* Full Name */}
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <Label htmlFor="signup-fullname" className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Full Name <span className="text-[#F83002]">*</span>
                                            </Label>
                                            {formErrors.fullname && (
                                                <span className="text-[10px] text-red-500">{formErrors.fullname}</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                id="signup-fullname"
                                                type="text"
                                                name="fullname"
                                                autoComplete="name"
                                                value={input.fullname}
                                                onChange={changeEventHandler}
                                                onBlur={handleBlur}
                                                placeholder="Sarah Jenkins"
                                                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs transition-all duration-200 outline-none bg-white dark:bg-slate-900 ${
                                                    formErrors.fullname
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-1.5 focus:ring-red-500/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#6A38C2] focus:ring-1.5 focus:ring-purple-500/20'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <Label htmlFor="signup-email" className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Email <span className="text-[#F83002]">*</span>
                                            </Label>
                                            {formErrors.email && (
                                                <span className="text-[10px] text-red-500">{formErrors.email}</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                                <Mail className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                id="signup-email"
                                                type="email"
                                                name="email"
                                                autoComplete="email"
                                                value={input.email}
                                                onChange={changeEventHandler}
                                                onBlur={handleBlur}
                                                placeholder="sarah@example.com"
                                                className={`w-full pl-8 pr-7 py-1.5 rounded-xl border text-xs transition-all duration-200 outline-none bg-white dark:bg-slate-900 ${
                                                    formErrors.email
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-1.5 focus:ring-red-500/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#6A38C2] focus:ring-1.5 focus:ring-purple-500/20'
                                                }`}
                                            />
                                            {isEmailValid && !formErrors.email && (
                                                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-emerald-500">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Phone Number & Profile Photo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* Phone Number */}
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <Label htmlFor="signup-phone" className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Phone <span className="text-[#F83002]">*</span>
                                            </Label>
                                            {formErrors.phoneNumber && (
                                                <span className="text-[10px] text-red-500">{formErrors.phoneNumber}</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                                <Phone className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                id="signup-phone"
                                                type="tel"
                                                name="phoneNumber"
                                                autoComplete="tel"
                                                value={input.phoneNumber}
                                                onChange={changeEventHandler}
                                                onBlur={handleBlur}
                                                placeholder="9876543210"
                                                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs transition-all duration-200 outline-none bg-white dark:bg-slate-900 ${
                                                    formErrors.phoneNumber
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-1.5 focus:ring-red-500/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#6A38C2] focus:ring-1.5 focus:ring-purple-500/20'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Profile Photo (Inline Picker) */}
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Avatar <span className="text-slate-400 lowercase">(optional)</span>
                                            </Label>
                                        </div>
                                        {filePreview ? (
                                            <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 h-[34px]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <img
                                                        src={filePreview}
                                                        alt="Avatar"
                                                        className="w-5 h-5 rounded-full object-cover ring-1 ring-[#6A38C2]"
                                                    />
                                                    <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[85px]">
                                                        {input.file?.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-0.5"
                                                    title="Remove"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor="signup-file"
                                                className="flex items-center justify-between px-2.5 py-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#6A38C2] dark:hover:border-purple-500 hover:bg-purple-50/20 transition-all cursor-pointer h-[34px] group"
                                            >
                                                <span className="text-[11px] text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 truncate">
                                                    Upload photo
                                                </span>
                                                <UploadCloud className="w-3.5 h-3.5 text-[#6A38C2] dark:text-purple-400 shrink-0" />
                                                <input
                                                    id="signup-file"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={changeFileHandler}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3: Password & Confirm Password */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* Password */}
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <Label htmlFor="signup-password" className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Password <span className="text-[#F83002]">*</span>
                                            </Label>
                                            {formErrors.password && (
                                                <span className="text-[10px] text-red-500">{formErrors.password}</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                id="signup-password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                autoComplete="new-password"
                                                value={input.password}
                                                onChange={changeEventHandler}
                                                onBlur={handleBlur}
                                                placeholder="Min. 6 chars"
                                                className={`w-full pl-8 pr-7 py-1.5 rounded-xl border text-xs transition-all duration-200 outline-none bg-white dark:bg-slate-900 ${
                                                    formErrors.password
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-1.5 focus:ring-red-500/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#6A38C2] focus:ring-1.5 focus:ring-purple-500/20'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <Label htmlFor="signup-confirm-password" className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Confirm <span className="text-[#F83002]">*</span>
                                            </Label>
                                            {formErrors.confirmPassword ? (
                                                <span className="text-[10px] text-red-500">{formErrors.confirmPassword}</span>
                                            ) : isPasswordMatch ? (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                    <CheckCircle2 className="w-3 h-3" /> Matched
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                id="signup-confirm-password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                autoComplete="new-password"
                                                value={input.confirmPassword}
                                                onChange={changeEventHandler}
                                                onBlur={handleBlur}
                                                placeholder="Repeat password"
                                                className={`w-full pl-8 pr-7 py-1.5 rounded-xl border text-xs transition-all duration-200 outline-none bg-white dark:bg-slate-900 ${
                                                    formErrors.confirmPassword
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-1.5 focus:ring-red-500/20'
                                                        : isPasswordMatch
                                                        ? 'border-emerald-300 dark:border-emerald-700/60 focus:border-emerald-500'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#6A38C2] focus:ring-1.5 focus:ring-purple-500/20'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                aria-label={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}
                                                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Password Strength Visual Mini Feedback */}
                                {input.password && (
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                                        <span className="flex items-center gap-1.5">
                                            <span>Strength:</span>
                                            <span className={`font-semibold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                                        </span>
                                        <div className="flex gap-1 w-24">
                                            {[1, 2, 3, 4].map((step) => (
                                                <div
                                                    key={step}
                                                    className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                                                        passwordStrength.score >= step
                                                            ? passwordStrength.color
                                                            : 'bg-slate-200 dark:bg-slate-700'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-1">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-10 rounded-xl bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            <span className="inline-flex items-center gap-2">
                                                Complete Registration
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Card Footer Navigation */}
                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-bold text-[#6A38C2] hover:text-[#5b30a6] dark:text-purple-400 hover:underline transition-colors"
                                >
                                    Sign in instead
                                </Link>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                By signing up, you agree to our Terms of Service & Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Signup;
