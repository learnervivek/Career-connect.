import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setUser, setToken } from '@/redux/authSlice';
import { 
    Loader2, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    User, 
    Briefcase, 
    ArrowRight, 
    ShieldCheck, 
    AlertCircle, 
    CheckCircle2 
} from 'lucide-react';
import AuthSidePanel from './AuthSidePanel';

const REMEMBER_EMAIL_KEY = 'career_connect_remembered_email';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, user } = useSelector(store => store.auth);

    const [input, setInput] = useState({
        email: '',
        password: '',
        role: 'student', // Default to Candidate for smoother onboarding
    });

    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState('');

    // Pre-fill remembered email if saved previously
    useEffect(() => {
        const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (savedEmail) {
            setInput(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    // Validation logic
    const validateField = (name, value) => {
        let error = '';
        if (name === 'email') {
            if (!value.trim()) {
                error = 'Email address is required.';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                error = 'Please enter a valid email address.';
            }
        }
        if (name === 'password') {
            if (!value) {
                error = 'Password is required.';
            }
        }
        if (name === 'role') {
            if (!value || (value !== 'student' && value !== 'recruiter')) {
                error = 'Please select your role.';
            }
        }
        return error;
    };

    const changeEventHandler = (e) => {
        const { name, value } = e.target;
        setInput(prev => ({ ...prev, [name]: value }));
        setServerError('');

        if (touched[name]) {
            const error = validateField(name, value);
            setFormErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    const selectRole = (selectedRole) => {
        setInput(prev => ({ ...prev, role: selectedRole }));
        setServerError('');
        if (touched.role) {
            setFormErrors(prev => ({ ...prev, role: '' }));
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setServerError('');

        // Validate all fields before submission
        const errors = {
            email: validateField('email', input.email),
            password: validateField('password', input.password),
            role: validateField('role', input.role),
        };

        setTouched({ email: true, password: true, role: true });
        setFormErrors(errors);

        if (errors.email || errors.password || errors.role) {
            return;
        }

        try {
            dispatch(setLoading(true));
            const response = await axios.post(
                `${USER_API_END_POINT}/login`,
                {
                    email: input.email.trim(),
                    password: input.password,
                    role: input.role,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                // Handle remember me preference
                if (rememberMe) {
                    localStorage.setItem(REMEMBER_EMAIL_KEY, input.email.trim());
                } else {
                    localStorage.removeItem(REMEMBER_EMAIL_KEY);
                }

                dispatch(setUser(response.data.user));
                if (response.data.token) {
                    dispatch(setToken(response.data.token));
                    localStorage.setItem('token', response.data.token);
                }
                toast.success(response.data.message || 'Logged in successfully!');
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || 'Invalid credentials or unable to connect.';
            setServerError(message);
            toast.error(message);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim());

    return (
        <div className="h-screen max-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-y-auto lg:overflow-hidden">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-4 min-h-0">
                <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-purple-500/5 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col lg:flex-row my-auto">
                    
                    {/* Left Brand Showcase Panel */}
                    <AuthSidePanel mode="login" />

                    {/* Right Form Card */}
                    <div className="w-full lg:w-1/2 p-5 sm:p-7 xl:p-8 flex flex-col justify-between">
                        <div>
                            {/* Form Header */}
                            <div className="mb-4">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-[#6A38C2] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 mb-2">
                                    <ShieldCheck className="w-3 h-3 text-[#6A38C2]" />
                                    <span>Secure Portal Access</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Welcome Back
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Sign in to track applications, coordinate interviews, and manage your profile.
                                </p>
                            </div>

                            {/* Server-side Error Alert */}
                            {serverError && (
                                <div 
                                    role="alert" 
                                    className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-2.5 text-xs animate-in fade-in duration-200"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-semibold uppercase tracking-wider text-[10px]">Authentication Failed</p>
                                        <p className="mt-0.5">{serverError}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submitHandler} noValidate className="space-y-3">
                                {/* Role Selection Pills */}
                                <div>
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                                        Select Role <span className="text-[#F83002]">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Account role">
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={input.role === 'student'}
                                            onClick={() => selectRole('student')}
                                            className={`relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
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
                                            className={`relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
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
                                    {formErrors.role && (
                                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {formErrors.role}
                                        </p>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div>
                                    <Label htmlFor="login-email" className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                                        Email Address <span className="text-[#F83002]">*</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            id="login-email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={input.email}
                                            onChange={changeEventHandler}
                                            onBlur={handleBlur}
                                            placeholder="you@example.com"
                                            className={`w-full pl-9 pr-9 py-2 rounded-xl border text-xs sm:text-sm transition-all duration-200 outline-none bg-white dark:bg-slate-900 ${
                                                formErrors.email
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-1.5 focus:ring-red-500/20 text-red-900 dark:text-red-100'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#6A38C2] focus:ring-1.5 focus:ring-purple-500/20'
                                            }`}
                                        />
                                        {isEmailValid && !formErrors.email && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-500">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.email && (
                                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {formErrors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <Label htmlFor="login-password" className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Password <span className="text-[#F83002]">*</span>
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Lock className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            id="login-password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            autoComplete="current-password"
                                            value={input.password}
                                            onChange={changeEventHandler}
                                            onBlur={handleBlur}
                                            placeholder="••••••••"
                                            className={`w-full pl-9 pr-9 py-2 rounded-xl border text-xs sm:text-sm transition-all duration-200 outline-none bg-white dark:bg-slate-900 ${
                                                formErrors.password
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-1.5 focus:ring-red-500/20 text-red-900 dark:text-red-100'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#6A38C2] focus:ring-1.5 focus:ring-purple-500/20'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    {formErrors.password && (
                                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {formErrors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center justify-between text-xs pt-0.5">
                                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded text-[#6A38C2] border-slate-300 dark:border-slate-700 focus:ring-[#6A38C2] cursor-pointer"
                                        />
                                        <span className="text-[11px]">Remember my email</span>
                                    </label>
                                </div>

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
                                                Signing in...
                                            </>
                                        ) : (
                                            <span className="inline-flex items-center gap-2">
                                                Sign In to Career Connect
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Card Footer Navigation */}
                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Don't have an account yet?{' '}
                                <Link
                                    to="/signup"
                                    className="font-bold text-[#6A38C2] hover:text-[#5b30a6] dark:text-purple-400 hover:underline transition-colors"
                                >
                                    Create a free account
                                </Link>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center justify-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                256-bit encrypted authentication & session protection.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;
