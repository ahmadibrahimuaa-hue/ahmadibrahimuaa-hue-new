import React, { useState, useEffect } from 'react';
import { 
  Lock, Key, ShieldCheck, UserCheck, CheckCircle2, AlertCircle, X, 
  Sparkles, Shield, User, Eye, EyeOff, ArrowRight
} from 'lucide-react';
import { authenticateTrainerOrAdmin, setCurrentAuthTrainer, getAllTrainersAsync } from '../utils/trainerStorage';
import { TrainerAccount } from '../types';
import { WhatsAppSupport } from './WhatsAppSupport';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trainer: TrainerAccount, role: 'super_admin' | 'trainer') => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'trainer' | 'admin_quick'>('trainer');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [quickPasscode, setQuickPasscode] = useState<string>('');
  const [showPass, setShowPass] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Pre-fetch live credentials from Firestore when modal opens
  useEffect(() => {
    if (isOpen) {
      getAllTrainersAsync().catch((err) => console.warn('Pre-fetch trainers in modal failed:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTrainerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser && !cleanPass) {
      setErrorMsg('يرجى إدخال كلمة المرور الخاصة بحسابك');
      return;
    }

    setIsSubmitting(true);
    try {
      // إذا أدخل المستخدم كلمة المرور فقط أو اسم المستخدم فقط، يتم التحقق بمرونة
      const res = cleanUser && cleanPass 
        ? await authenticateTrainerOrAdmin(cleanUser, cleanPass)
        : await authenticateTrainerOrAdmin(cleanPass || cleanUser);

      if (res.success && res.trainer) {
        setCurrentAuthTrainer(res.trainer);
        onSuccess(res.trainer, res.role || 'trainer');
        onClose();
      } else {
        setErrorMsg(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (e: any) {
      setErrorMsg('حدث خطأ أثناء تسجيل الدخول: ' + (e?.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPass = quickPasscode.trim();

    if (!cleanPass) {
      setErrorMsg('يرجى إدخال الرمز السري للمشرف العام أو كلمة مرور حسابك');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authenticateTrainerOrAdmin(cleanPass);
      if (res.success && res.trainer) {
        setCurrentAuthTrainer(res.trainer);
        onSuccess(res.trainer, res.role || 'super_admin');
        onClose();
      } else {
        setErrorMsg(res.error || 'الرمز السري غير صحيح');
      }
    } catch (e: any) {
      setErrorMsg('حدث خطأ أثناء التحقق: ' + (e?.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn dir-rtl no-print">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-5 text-right font-tajawal relative overflow-hidden">
        
        {/* Top Decorative Line */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-400"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-quran">
              <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>بوابة المعلمين والإشراف المعتمدة</span>
            </div>
            <h2 className="text-xl font-black font-quran text-slate-900 dark:text-amber-100 mt-0.5">
              تسجيل دخول المدرب والمشرف
            </h2>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl text-xs font-bold font-quran">
          <button
            type="button"
            onClick={() => { setAuthMode('trainer'); setErrorMsg(''); }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'trainer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>حساب المدرب والمعلم</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setAuthMode('admin_quick'); setErrorMsg(''); }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'admin_quick'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>المشرف العام (Master)</span>
          </button>
        </div>

        {/* Trainer Login Form */}
        {authMode === 'trainer' ? (
          <form onSubmit={handleTrainerLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-quran">
                اسم المستخدم أو كود المعلم (اختياري عند كتابة باسورد المشرف):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errorMsg) setErrorMsg(''); }}
                  placeholder="مثال: ahmed أو اتركه فارغاً للدخول بالباسورد فقط"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans text-sm pr-4 pl-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                />
                <User className="w-4 h-4 text-slate-400 absolute top-3.5 left-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-quran">
                كلمة المرور (الباسورد):
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(''); }}
                  placeholder="اكتب كلمة المرور الخاصة بحسابك..."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans text-sm pr-4 pl-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-3.5 left-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-quran text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التحقق...' : 'دخول لوحة المعلم'}</span>
            </button>
          </form>
        ) : (
          /* Super Admin Direct Passcode Form */
          <form onSubmit={handleQuickAdminLogin} className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200">
              دخول مباشر بكود المشرف العام للمنصة لإدارة كل المعلمين، بنوك الأسئلة، والتحكم في تراخيص المدربين.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-quran">
                الرمز السري الرئيسي للمشرف العام:
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={quickPasscode}
                  onChange={(e) => { setQuickPasscode(e.target.value); if (errorMsg) setErrorMsg(''); }}
                  placeholder="أدخل الرمز السري الخاص بك..."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans text-sm pr-4 pl-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-3.5 left-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black font-quran text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التحقق...' : 'دخول لوحة المشرف العام'}</span>
            </button>
          </form>
        )}

        {/* WhatsApp Support Section */}
        <WhatsAppSupport variant="modal-footer" />

      </div>
    </div>
  );
};
