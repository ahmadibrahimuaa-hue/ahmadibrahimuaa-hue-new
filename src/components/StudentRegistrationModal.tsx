import React, { useState, useEffect } from 'react';
import { 
  User, Award, ShieldCheck, CheckCircle2, AlertCircle, BookOpen, 
  Key, Users, Shield, Lock, Eye, EyeOff, Check, ArrowRight, Sparkles, School
} from 'lucide-react';
import { saveStudentProfile } from '../utils/studentStorage';
import { 
  getTrainerByReferralCode, 
  getActiveTrainersList, 
  checkTrainerCodeStatus,
  authenticateTrainerOrAdmin,
  setCurrentAuthTrainer,
  TrainerCodeStatus
} from '../utils/trainerStorage';
import { TrainerAccount } from '../types';
import { WhatsAppSupport } from './WhatsAppSupport';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onRegistered: (name: string) => void;
  onTeacherAuthSuccess?: (trainer: TrainerAccount, role: 'super_admin' | 'trainer') => void;
  onOpenTeacherAuth?: () => void;
  canClose?: boolean;
  onClose?: () => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onRegistered,
  onTeacherAuthSuccess,
  onOpenTeacherAuth,
  canClose = false,
  onClose,
}) => {
  // Primary Choice: Student vs Trainer
  const [selectedRole, setSelectedRole] = useState<'student' | 'trainer'>('student');

  // Student Form State
  const [name, setName] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [codeStatus, setCodeStatus] = useState<TrainerCodeStatus | null>(null);
  const [detectedTrainer, setDetectedTrainer] = useState<TrainerAccount | null>(null);
  const [activeTrainers, setActiveTrainers] = useState<TrainerAccount[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [studentError, setStudentError] = useState<string>('');
  const [isSubmittingStudent, setIsSubmittingStudent] = useState<boolean>(false);

  // Trainer / Admin Login State
  const [trainerLoginMode, setTrainerLoginMode] = useState<'trainer_account' | 'admin_master'>('trainer_account');
  const [trainerUsername, setTrainerUsername] = useState<string>('');
  const [trainerPassword, setTrainerPassword] = useState<string>('');
  const [adminMasterCode, setAdminMasterCode] = useState<string>('');
  const [showTrainerPass, setShowTrainerPass] = useState<boolean>(false);
  const [trainerError, setTrainerError] = useState<string>('');
  const [isSubmittingTrainer, setIsSubmittingTrainer] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('trainer') || params.get('teacher') || params.get('code');
      if (ref && ref.toLowerCase() !== 'admin') {
        setReferralCode(ref);
        const status = checkTrainerCodeStatus(ref);
        setCodeStatus(status);
        if (status.trainer) {
          setDetectedTrainer(status.trainer);
          setSelectedTrainerId(status.trainer.id);
        }
      }

      // If URL has teacher param, select trainer role by default
      if (params.get('mode') === 'teacher' || params.get('auth') === 'teacher' || ref?.toLowerCase() === 'admin') {
        setSelectedRole('trainer');
        if (ref?.toLowerCase() === 'admin') {
          setTrainerLoginMode('admin_master');
        }
      }

      const list = getActiveTrainersList().filter((t) => t.role !== 'super_admin');
      setActiveTrainers(list);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle student referral code input changes
  const handleReferralChange = (val: string) => {
    setReferralCode(val);
    setStudentError('');
    if (!val.trim()) {
      setCodeStatus(null);
      setDetectedTrainer(null);
      return;
    }
    const status = checkTrainerCodeStatus(val);
    setCodeStatus(status);
    if (status.found && status.trainer) {
      setDetectedTrainer(status.trainer);
      setSelectedTrainerId(status.trainer.id);
    } else {
      setDetectedTrainer(null);
    }
  };

  // Student Form Submission
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setStudentError('يرجى كتابة الاسم الكامل (الثلاثي أو الرباعي) للمتابعة');
      return;
    }
    if (cleanName.length < 3) {
      setStudentError('الاسم المدخل قصير جداً، يرجى كتابة اسم ثلاثي أو رباعي واضح');
      return;
    }

    // If student typed a code but it's suspended, warn them
    if (referralCode.trim() && codeStatus?.status === 'suspended') {
      setStudentError('كود المعلم المدخل اشتراكه معلق حالياً، يرجى مراجعة المعلم أو اختيار معلم آخر');
      return;
    }

    setIsSubmittingStudent(true);
    setStudentError('');

    let finalTrainerId = detectedTrainer?.id || selectedTrainerId;
    let finalTrainerName = detectedTrainer?.name;

    if (!finalTrainerName && selectedTrainerId) {
      const matched = activeTrainers.find((t) => t.id === selectedTrainerId);
      if (matched) {
        finalTrainerName = matched.name;
        finalTrainerId = matched.id;
      }
    }

    try {
      await saveStudentProfile(
        cleanName,
        finalTrainerId || undefined,
        finalTrainerName || undefined,
        referralCode.trim() || undefined
      );
      onRegistered(cleanName);
    } catch (err) {
      console.error('Registration save error:', err);
      onRegistered(cleanName);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Trainer Form Submission
  const handleTrainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrainerError('');
    setIsSubmittingTrainer(true);

    try {
      if (trainerLoginMode === 'admin_master') {
        const cleanAdminPass = adminMasterCode.trim();
        if (!cleanAdminPass) {
          setTrainerError('يرجى إدخال الرمز السري للمشرف العام أو كلمة مرور حسابك');
          setIsSubmittingTrainer(false);
          return;
        }
        const res = await authenticateTrainerOrAdmin(cleanAdminPass);
        if (res.success && res.trainer) {
          setCurrentAuthTrainer(res.trainer);
          if (onTeacherAuthSuccess) {
            onTeacherAuthSuccess(res.trainer, 'super_admin');
          } else if (onOpenTeacherAuth) {
            onOpenTeacherAuth();
          }
        } else {
          setTrainerError(res.error || 'الرمز السري للمشرف العام غير صحيح');
        }
      } else {
        const cleanUser = trainerUsername.trim();
        const cleanPass = trainerPassword.trim();
        if (!cleanUser && !cleanPass) {
          setTrainerError('يرجى إدخال كلمة المرور الخاصة بحسابك');
          setIsSubmittingTrainer(false);
          return;
        }
        const res = cleanUser && cleanPass
          ? await authenticateTrainerOrAdmin(cleanUser, cleanPass)
          : await authenticateTrainerOrAdmin(cleanPass || cleanUser);

        if (res.success && res.trainer) {
          setCurrentAuthTrainer(res.trainer);
          if (onTeacherAuthSuccess) {
            onTeacherAuthSuccess(res.trainer, res.role || 'trainer');
          } else if (onOpenTeacherAuth) {
            onOpenTeacherAuth();
          }
        } else {
          setTrainerError(res.error || 'بيانات الدخول غير صحيحة');
        }
      }
    } catch (err: any) {
      setTrainerError('حدث خطأ أثناء تسجيل الدخول: ' + (err?.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSubmittingTrainer(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn dir-rtl no-print">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-7 border-2 border-amber-400 shadow-2xl space-y-5 text-right font-tajawal relative overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Top Decorative Gradient */}
        <div className="absolute top-0 right-0 left-0 h-2.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-400"></div>

        {/* Header Branding */}
        <div className="text-center pt-1 pb-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold font-quran border border-emerald-300/80 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>منصة دروس التجويد القرآنية المعتمدة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-quran text-slate-900 dark:text-amber-100">
            تسجيل الدخول وبدء الاستخدام
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            حدد صفتك في المنصة للمتابعة إلى واجهتك المخصصة:
          </p>
        </div>

        {/* Primary Role Selector: Student vs Trainer */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('student');
              setStudentError('');
              setTrainerError('');
            }}
            className={`p-3.5 rounded-2xl border-2 transition-all text-right flex flex-col justify-between gap-2 cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-slate-900 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-300 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                selectedRole === 'student' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'student' ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-700'
              }`}>
                {selectedRole === 'student' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div>
              <h3 className="font-black font-quran text-sm sm:text-base text-slate-900 dark:text-amber-200">
                🎓 أنا طالب / دارس
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                دراسة المتون، حل الاختبارات، ومتابعة درجاتك مع معلمك.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('trainer');
              setStudentError('');
              setTrainerError('');
            }}
            className={`p-3.5 rounded-2xl border-2 transition-all text-right flex flex-col justify-between gap-2 cursor-pointer ${
              selectedRole === 'trainer'
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                selectedRole === 'trainer' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'trainer' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700'
              }`}>
                {selectedRole === 'trainer' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div>
              <h3 className="font-black font-quran text-sm sm:text-base text-slate-900 dark:text-emerald-300">
                👨‍🏫 أنا معلم / مدرب
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                إدارة الفصول، متابعة نتائج الطلاب، وتخصيص الشهادات.
              </p>
            </div>
          </button>
        </div>

        {/* VIEW 1: STUDENT REGISTRATION FORM */}
        {selectedRole === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4 pt-1 animate-fadeIn">
            {/* Student Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-quran">
                اسم الدارس / المتدرب (الثلاثي أو الرباعي): <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (studentError) setStudentError('');
                }}
                placeholder="مثال: أحمد عبد الله المحمود..."
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-amber-200 font-bold font-quran text-base px-4 py-3 rounded-2xl border-2 border-amber-400/80 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-400/20 text-right transition-all shadow-inner placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm"
                autoFocus
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                سيُكتب هذا الاسم بدقة في الشهادات الرسمية وسجل الدرجات المعتمد.
              </p>
            </div>

            {/* Teacher Code / Referral Code Section */}
            <div className="space-y-2 bg-gradient-to-br from-amber-50/70 via-slate-50 to-emerald-50/40 dark:from-slate-950 dark:to-slate-900 p-4 rounded-2xl border-2 border-amber-300/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-quran flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>كود المعلم المشرف (كود الاشتراك بعد التفعيل):</span>
                </label>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                  مهم للربط
                </span>
              </div>
              
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                أدخل الكود الخاص بمعلمك (الذي منحه المشرف العام له بعد الاشتراك) ليتم إدراجك في فصله ومتابعة درجاتك وإصدار شهادتك:
              </p>

              <div className="relative">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => handleReferralChange(e.target.value)}
                  placeholder="مثال: AHMED-QURAN أو رمز كود معلمك"
                  className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right uppercase tracking-wider placeholder:tracking-normal placeholder:font-normal"
                />
                {codeStatus?.found && codeStatus.status === 'active' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute top-2.5 left-3" />
                )}
              </div>

              {/* Code Verification Status Feedback Card */}
              {codeStatus && codeStatus.found && codeStatus.status === 'active' && codeStatus.trainer && (
                <div className="bg-emerald-100 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 flex items-center gap-2.5 text-xs font-quran animate-fadeIn">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 dark:text-emerald-100">
                      ✓ كود صحيح ومفعّل: المعلم المشرف هو <strong>[{codeStatus.trainer.name}]</strong>
                    </div>
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      سيتم ربط تسليماتك وشهاداتك تلقائياً بحساب هذا المعلم.
                    </div>
                  </div>
                </div>
              )}

              {codeStatus && codeStatus.found && codeStatus.status === 'suspended' && (
                <div className="bg-rose-100 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 p-3 rounded-xl border border-rose-300 dark:border-rose-700 flex items-center gap-2 text-xs font-quran animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{codeStatus.message}</span>
                </div>
              )}

              {referralCode.trim() && codeStatus && !codeStatus.found && (
                <div className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 p-2.5 rounded-xl border border-amber-300 text-xs font-tajawal flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>لم يتم العثور على معلم بهذا الكود. يمكنك التأكد من المعلم أو اختياره من القائمة أدناه:</span>
                </div>
              )}

              {/* Dropdown helper if student wants to pick from active trainers list */}
              {activeTrainers.length > 0 && (
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    أو اختر المعلم المشرف من القائمة المعتمدة:
                  </label>
                  <select
                    value={selectedTrainerId}
                    onChange={(e) => {
                      setSelectedTrainerId(e.target.value);
                      const matched = activeTrainers.find((t) => t.id === e.target.value);
                      if (matched) {
                        setReferralCode(matched.referralCode);
                        const st = checkTrainerCodeStatus(matched.referralCode);
                        setCodeStatus(st);
                        setDetectedTrainer(matched);
                      } else {
                        setReferralCode('');
                        setCodeStatus(null);
                        setDetectedTrainer(null);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 font-quran"
                  >
                    <option value="">-- دراسة عامة (بدون معلم مشرف محدد) --</option>
                    {activeTrainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (كود المعلم: {t.referralCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {studentError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{studentError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingStudent}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black font-quran text-base py-3.5 px-6 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border border-amber-300 disabled:opacity-50"
            >
              <BookOpen className="w-5 h-5" />
              <span>{isSubmittingStudent ? 'جاري الاعتماد وتوثيق الحساب...' : 'تأكيد التسجيل وبدء المنهاج القرآني'}</span>
            </button>
          </form>
        )}

        {/* VIEW 2: TEACHER / TRAINER AUTHENTICATION */}
        {selectedRole === 'trainer' && (
          <form onSubmit={handleTrainerSubmit} className="space-y-4 pt-1 animate-fadeIn">
            {/* Trainer Sub-tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl text-xs font-bold font-quran">
              <button
                type="button"
                onClick={() => {
                  setTrainerLoginMode('trainer_account');
                  setTrainerError('');
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  trainerLoginMode === 'trainer_account'
                    ? 'bg-white dark:bg-slate-900 text-emerald-950 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>حساب المعلم والمدرب</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTrainerLoginMode('admin_master');
                  setTrainerError('');
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  trainerLoginMode === 'admin_master'
                    ? 'bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>المشرف العام (الإدارة)</span>
              </button>
            </div>

            {trainerLoginMode === 'trainer_account' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-quran">
                    اسم المستخدم أو كود المعلم (اختياري عند إدخال باسورد المشرف):
                  </label>
                  <input
                    type="text"
                    value={trainerUsername}
                    onChange={(e) => {
                      setTrainerUsername(e.target.value);
                      if (trainerError) setTrainerError('');
                    }}
                    placeholder="مثال: ahmed أو اتركه فارغاً للدخول بالباسورد فقط"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-quran">
                    كلمة المرور الخاصة بالحساب (الباسورد):
                  </label>
                  <div className="relative">
                    <input
                      type={showTrainerPass ? 'text' : 'password'}
                      value={trainerPassword}
                      onChange={(e) => {
                        setTrainerPassword(e.target.value);
                        if (trainerError) setTrainerError('');
                      }}
                      placeholder="كلمة المرور الخاصة بحسابك..."
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right font-sans pl-10"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowTrainerPass(!showTrainerPass)}
                      className="absolute top-3 left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showTrainerPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-quran">
                    رمز المرور السري للمشرف العام (Master Key):
                  </label>
                  <div className="relative">
                    <input
                      type={showTrainerPass ? 'text' : 'password'}
                      value={adminMasterCode}
                      onChange={(e) => {
                        setAdminMasterCode(e.target.value);
                        if (trainerError) setTrainerError('');
                      }}
                      placeholder="أدخل الرمز السري الخاص بك..."
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm px-4 py-3 rounded-xl border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right font-sans pl-10"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowTrainerPass(!showTrainerPass)}
                      className="absolute top-3.5 left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showTrainerPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    خاص بإدارة المنصة لإنشاء حسابات المعلمين وإصدار أكواد التراخيص وتصميم الشهادات.
                  </p>
                </div>
              </div>
            )}

            {trainerError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{trainerError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingTrainer}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black font-quran text-base py-3.5 px-6 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border border-amber-400/40 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>{isSubmittingTrainer ? 'جاري التحقق...' : 'دخول لوحة تحكم المعلم والمشرف'}</span>
            </button>
          </form>
        )}

        {/* WhatsApp Support Section */}
        <WhatsAppSupport variant="modal-footer" />

      </div>
    </div>
  );
};
