
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebaseConfig';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, Check, Eye, EyeOff, Globe, UserCircle } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Validation Regex
  // Min 6 chars, 1 uppercase, 1 number, 1 symbol
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/;

  const validatePassword = (pwd: string) => {
    if (!passwordRegex.test(pwd)) {
      return "Password must be at least 6 characters, include 1 uppercase letter, 1 number, and 1 symbol.";
    }
    return null;
  };

  const getFriendlyErrorMessage = (errCode: string) => {
      switch (errCode) {
          case 'auth/email-already-in-use': return 'That email is already in use.';
          case 'auth/invalid-credential': return 'Invalid email or password.';
          case 'auth/weak-password': return 'Password is too weak.';
          case 'auth/user-not-found': return 'No account found with this email.';
          case 'auth/wrong-password': return 'Incorrect password.';
          case 'auth/unauthorized-domain': return 'DOMAIN_ERROR'; // Special flag to render custom UI
          case 'auth/popup-closed-by-user': return 'Sign in cancelled.';
          case 'auth/cancelled-popup-request': return 'Only one sign-in attempt allowed at a time.';
          case 'auth/operation-not-allowed': return 'Guest login is not enabled in Firebase Console.';
          default: return 'Authentication failed. Please try again.';
      }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Signup Validation
        const pwdError = validatePassword(password);
        if (pwdError) {
          setError(pwdError);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  const handleSocialLogin = async (provider: any) => {
    setError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Social login error:", err);
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("Guest login error:", err);
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-y-auto">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-500/10 mb-4">
                <Sparkles className="text-teal-500" size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">SereneMind</h1>
            <p className="text-slate-500 dark:text-slate-400">Your secure wellness sanctuary.</p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
                <button 
                    onClick={() => { setIsLogin(true); setError(''); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Log In
                </button>
                <button 
                    onClick={() => { setIsLogin(false); setError(''); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sign Up
                </button>
            </div>

            {error === 'DOMAIN_ERROR' ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 mb-6">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-2">
                        <Globe size={18} />
                        <h3>Domain Not Authorized</h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        This app is running on a domain that hasn't been added to your Firebase project yet.
                    </p>
                    <ol className="text-xs text-slate-600 dark:text-slate-300 list-decimal pl-4 space-y-1 mb-2">
                        <li>Go to <b>Firebase Console</b> {'>'} <b>Authentication</b></li>
                        <li>Click <b>Settings</b> {'>'} <b>Authorized Domains</b></li>
                        <li>Click <b>Add Domain</b> and paste current URL host.</li>
                    </ol>
                    <div className="text-[10px] font-mono bg-white dark:bg-slate-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                        {window.location.hostname}
                    </div>
                </div>
            ) : error && (
                <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-medium mb-6">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                </div>
                
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500/50 outline-none"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                
                {!isLogin && (
                    <div className="relative animate-slide-up">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="password" 
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500/50 outline-none"
                        />
                    </div>
                )}
                
                {!isLogin && (
                     <div className="text-[10px] text-slate-400 px-2 leading-relaxed">
                        Password must have 6+ chars, 1 uppercase, 1 number, and 1 symbol.
                     </div>
                )}

                <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isLogin ? 'Log In' : 'Create Account'} <ArrowRight size={20} />
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => handleSocialLogin(googleProvider)}
                    className="flex items-center justify-center py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors gap-2 font-bold text-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Google
                </button>
                <button 
                    onClick={() => handleSocialLogin(appleProvider)}
                    className="flex items-center justify-center py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors gap-2 font-bold text-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.93 2.4.25 4.48 1.47 5.7 3.66-3.23 1.6-2.82 5.5.01 6.81-1.04 2.5-2.63 4.58-4.48 2.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.39-1.97 4.31-3.74 4.25z"/></svg>
                    Apple
                </button>
            </div>
            
            <button
                onClick={handleGuestLogin}
                className="w-full mt-4 py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-center gap-2"
            >
                <UserCircle size={20} />
                Continue as Guest
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
