import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert, Key, Lock, Unlock, 
  Trash2, Edit3, Copy, Check, ExternalLink, Search, RefreshCw, AlertTriangle,
  Phone, Calendar, Award, FileText, CheckCircle2, X, PlusCircle, Power,
  Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { TrainerAccount } from '../types';
import { 
  getLocalTrainers, 
  subscribeTrainers, 
  saveTrainerAccount, 
  deleteTrainerAccount, 
  toggleTrainerStatus, 
  updateTrainerPassword,
  getAllTrainersAsync
} from '../utils/trainerStorage';
import { getStudentSubmissionsAsync, getRegisteredStudentsAsync } from '../utils/studentStorage';

interface AdminTrainersPanelProps {
  onSelectTrainerForFilter?: (trainerId: string) => void;
}

export const AdminTrainersPanel: React.FC<AdminTrainersPanelProps> = ({
  onSelectTrainerForFilter,
}) => {
  const [trainers, setTrainers] = useState<TrainerAccount[]>(getLocalTrainers());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerAccount | null>(null);
  const [changingPassTrainer, setChangingPassTrainer] = useState<TrainerAccount | null>(null);
  const [oldPasswordVal, setOldPasswordVal] = useState<string>('');
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [passModalError, setPassModalError] = useState<string>('');
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState<boolean>(false);
  const [passUpdateSuccessMsg, setPassUpdateSuccessMsg] = useState<string>('');
  const [deleteConfirmTrainer, setDeleteConfirmTrainer] = useState<TrainerAccount | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formReferralCode, setFormReferralCode] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formMaxStudents, setFormMaxStudents] = useState<number>(0);
  const [formError, setFormError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Stats
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = subscribeTrainers((list) => {
      setTrainers(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Load student & submission statistics by trainer
    const loadStats = async () => {
      try {
        const [students, submissions] = await Promise.all([
          getRegisteredStudentsAsync(),
          getStudentSubmissionsAsync(),
        ]);

        const sCounts: Record<string, number> = {};
        students.forEach((s) => {
          if (s.trainerId) {
            sCounts[s.trainerId] = (sCounts[s.trainerId] || 0) + 1;
          }
        });
        setStudentCounts(sCounts);

        const subCounts: Record<string, number> = {};
        submissions.forEach((sub) => {
          if (sub.trainerId) {
            subCounts[sub.trainerId] = (subCounts[sub.trainerId] || 0) + 1;
          }
        });
        setSubmissionCounts(subCounts);
      } catch (e) {
        console.error('Stats loading error:', e);
      }
    };
    loadStats();
  }, [trainers]);

  const handleCopy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2500);
    } else {
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const openAddModal = () => {
    setEditingTrainer(null);
    setFormName('');
    setFormUsername('');
    setFormPassword(Math.floor(100000 + Math.random() * 900000).toString());
    setFormReferralCode('TR-' + Math.floor(100 + Math.random() * 900));
    setFormPhone('');
    setFormNotes('');
    setFormMaxStudents(0);
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (t: TrainerAccount) => {
    setEditingTrainer(t);
    setFormName(t.name);
    setFormUsername(t.username);
    setFormPassword(t.password);
    setFormReferralCode(t.referralCode);
    setFormPhone(t.phone || '');
    setFormNotes(t.notes || '');
    setFormMaxStudents(t.maxStudents || 0);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanUser = formUsername.trim().toLowerCase();
    const cleanPass = formPassword.trim();
    const cleanCode = (formReferralCode.trim() || cleanUser).toUpperCase();

    if (!cleanName || !cleanUser || !cleanPass) {
      setFormError('يرجى ملء جميع الحقول الإلزامية (الاسم، اسم المستخدم، وكلمة المرور)');
      return;
    }

    // Check duplicate username if adding new
    if (!editingTrainer && trainers.some((t) => t.username.toLowerCase() === cleanUser)) {
      setFormError('اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم مستخدم آخر');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const trainerData: TrainerAccount = {
        id: editingTrainer?.id || `tr_${cleanUser}_${Date.now().toString().slice(-4)}`,
        name: cleanName,
        username: cleanUser,
        password: cleanPass,
        role: editingTrainer?.role || 'trainer',
        status: editingTrainer?.status || 'active',
        referralCode: cleanCode,
        phone: formPhone.trim() || undefined,
        notes: formNotes.trim() || undefined,
        maxStudents: Number(formMaxStudents) || 0,
        createdAt: editingTrainer?.createdAt || new Date().toISOString().split('T')[0],
      };

      await saveTrainerAccount(trainerData);
      setShowAddModal(false);
      setEditingTrainer(null);
    } catch (err: any) {
      console.error('Error saving trainer:', err);
      setFormError('فشل حفظ الحساب: ' + (err?.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (trainer: TrainerAccount) => {
    const nextStatus = trainer.status === 'active' ? 'suspended' : 'active';
    try {
      await toggleTrainerStatus(trainer.id, nextStatus);
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const openPasswordModal = (trainer: TrainerAccount) => {
    const current = getLocalTrainers();
    const isSuper = trainer.role === 'super_admin' || trainer.id === 'super_admin';
    const latest = current.find((t) => t.id === trainer.id || (isSuper && (t.role === 'super_admin' || t.id === 'super_admin'))) || trainer;
    setChangingPassTrainer(latest);
    setOldPasswordVal('');
    setNewPasswordVal('');
    setPassModalError('');
    setShowOldPass(false);
    setShowNewPass(false);
  };

  const handleUpdatePassword = async () => {
    if (!changingPassTrainer) return;
    if (!oldPasswordVal.trim()) {
      setPassModalError('يرجى كتابة كلمة المرور الحالية (القديمة) للتحقق');
      return;
    }
    if (!newPasswordVal.trim()) {
      setPassModalError('يرجى كتابة كلمة المرور الجديدة');
      return;
    }
    if (oldPasswordVal.trim() === newPasswordVal.trim()) {
      setPassModalError('كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية');
      return;
    }

    setPassModalError('');
    setIsUpdatingPass(true);
    try {
      const cleanOld = oldPasswordVal.trim();
      const cleanNew = newPasswordVal.trim();
      const result = await updateTrainerPassword(changingPassTrainer.id, cleanOld, cleanNew);

      if (!result.success) {
        setPassModalError(result.error || 'فشل تحديث كلمة المرور');
        setIsUpdatingPass(false);
        return;
      }

      const isSuper = changingPassTrainer.role === 'super_admin';
      const msg = isSuper
        ? 'تم تحديث كلمة مرور المشرف العام بنجاح بعد التحقق من الكلمة القديمة، وتم إلغاء وإبطال كلمة المرور السابقة تماماً ✅'
        : `تم تحديث كلمة مرور المعلم [${changingPassTrainer.name}] بنجاح وإلغاء الكلمة السابقة ✅`;
      
      setPassUpdateSuccessMsg(msg);
      setTimeout(() => setPassUpdateSuccessMsg(''), 5000);
      setChangingPassTrainer(null);
      setOldPasswordVal('');
      setNewPasswordVal('');
      setPassModalError('');
    } catch (e: any) {
      console.error('Failed to update password:', e);
      setPassModalError('حدث خطأ أثناء حفظ كلمة المرور الجديدة: ' + (e?.message || ''));
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!deleteConfirmTrainer) return;
    try {
      await deleteTrainerAccount(deleteConfirmTrainer.id);
      setDeleteConfirmTrainer(null);
    } catch (e: any) {
      alert(e?.message || 'فشل حذف الحساب');
    }
  };

  // Filtered List
  const filteredTrainers = trainers.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (t.name || '').toLowerCase().includes(term) ||
        (t.username || '').toLowerCase().includes(term) ||
        (t.referralCode || '').toLowerCase().includes(term) ||
        (t.notes ? t.notes.toLowerCase().includes(term) : false)
      );
    }
    return true;
  });

  const activeCount = trainers.filter((t) => t.status === 'active' && t.role !== 'super_admin').length;
  const suspendedCount = trainers.filter((t) => t.status === 'suspended').length;
  const totalTrainers = trainers.filter((t) => t.role !== 'super_admin').length;

  return (
    <div className="space-y-6 dir-rtl text-right font-tajawal">
      
      {/* Success Notification Banner */}
      {passUpdateSuccessMsg && (
        <div className="bg-emerald-900/90 text-emerald-100 border-2 border-emerald-400 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold font-quran">{passUpdateSuccessMsg}</span>
          </div>
          <button
            onClick={() => setPassUpdateSuccessMsg('')}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner with Stats & Add Button */}
      <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl border border-amber-400/40 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold font-quran">
            <Shield className="w-3.5 h-3.5" />
            <span>لوحة الإدارة والاشتراكات المركزية للمشرف العام</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-quran text-amber-100">
            إدارة المعلمين وتراخيص المدربين 🔑
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            يمكنك من هنا إضافة مدربين جدد، توليد وتعديل كلمات المرور، التحكم في قفل أو تفعيل حسابات المدربين، ومتابعة فصول كل معلم بشكل منفصل.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black font-quran text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0 border border-amber-300"
        >
          <UserPlus className="w-5 h-5" />
          <span>إضافة مدرب / معلم جديد +</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">إجمالي المدربين</div>
            <div className="text-2xl font-black font-sans text-slate-900 dark:text-amber-100">{totalTrainers}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">الحسابات النشطة (مفتوحة)</div>
            <div className="text-2xl font-black font-sans text-emerald-800 dark:text-emerald-300">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-rose-700 dark:text-rose-400 font-medium">الحسابات الموقوفة (مغلقة)</div>
            <div className="text-2xl font-black font-sans text-rose-800 dark:text-rose-300">{suspendedCount}</div>
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، اسم المستخدم، الكود..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            الكل ({trainers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            النشطة فقط
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'suspended'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            الموقوفة فقط
          </button>
        </div>
      </div>

      {/* Trainers Table / Cards */}
      <div className="space-y-4">
        {filteredTrainers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">لا يوجد مدربين يطابقون خيارات البحث</div>
            <button
              onClick={openAddModal}
              className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              إضافة مدرب جديد الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTrainers.map((trainer) => {
              const isSuper = trainer.role === 'super_admin';
              const sCount = studentCounts[trainer.id] || 0;
              const subCount = submissionCounts[trainer.id] || 0;
              const studentShareLink = typeof window !== 'undefined' 
                ? `${window.location.origin}${window.location.pathname}?ref=${trainer.referralCode}`
                : `?ref=${trainer.referralCode}`;

              return (
                <div
                  key={trainer.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 transition-all shadow-sm relative overflow-hidden space-y-4 ${
                    isSuper 
                      ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/20' 
                      : trainer.status === 'suspended' 
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 opacity-90' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        isSuper
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : trainer.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300'
                      }`}>
                        {isSuper ? <Shield className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold font-quran text-slate-900 dark:text-amber-100">
                            {trainer.name}
                          </h3>
                          {isSuper ? (
                            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-quran shadow-xs">
                              المشرف العام (المالك)
                            </span>
                          ) : trainer.status === 'active' ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-quran flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>نشط ومفعل</span>
                            </span>
                          ) : (
                            <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-quran flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>موقوف / مغلق ⛔</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-sans mt-0.5 flex items-center gap-2">
                          <span>اسم المستخدم: <strong>@{trainer.username}</strong></span>
                          {trainer.createdAt && (
                            <span>• مسجل: {trainer.createdAt}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Status Toggle (Only for non-super admins) */}
                    {!isSuper && (
                      <button
                        onClick={() => handleToggleStatus(trainer)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                          trainer.status === 'active'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        title={trainer.status === 'active' ? 'قفل وتعطيل الحساب فوراً' : 'إعادة تفعيل الحساب'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{trainer.status === 'active' ? 'إيقاف الصلاحية' : 'تفعيل الحساب'}</span>
                      </button>
                    )}
                  </div>

                  {/* Credentials & Access Info Box */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">كلمة المرور (الباسورد):</span>
                        <div className="flex items-center gap-2 font-mono font-bold text-amber-600 dark:text-amber-400">
                          <span>{trainer.password}</span>
                          <button
                            onClick={() => openPasswordModal(trainer)}
                            className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded cursor-pointer"
                            title="تعديل الباسورد"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">كود الإحالة للطلاب:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{trainer.referralCode}</span>
                          <button
                            onClick={() => handleCopy(trainer.referralCode, 'code')}
                            className="text-slate-400 hover:text-amber-600 p-1 hover:bg-slate-100 rounded cursor-pointer"
                            title="نسخ الكود"
                          >
                            {copiedCode === trainer.referralCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Direct Student Link */}
                    <div className="flex items-center justify-between gap-2 bg-amber-50/60 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/60 text-[11px]">
                      <span className="text-amber-900 dark:text-amber-200 truncate">
                        <strong>رابط الطلاب المباشر:</strong> {studentShareLink}
                      </span>
                      <button
                        onClick={() => handleCopy(studentShareLink, 'link')}
                        className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedLink === studentShareLink ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-950" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Notes & License Details */}
                    {trainer.notes && (
                      <div className="text-slate-600 dark:text-slate-400 text-xs font-tajawal bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <strong>ملاحظات الاشتراك:</strong> {trainer.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions & Stats */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 font-sans">
                      <span title="عدد الطلاب المسجلين">👥 <strong>{sCount}</strong> طالب</span>
                      <span title="عدد الاختبارات المحلولة">📝 <strong>{subCount}</strong> إجابة</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isSuper && (
                        <>
                          <button
                            onClick={() => openEditModal(trainer)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                            title="تعديل بيانات المدرب"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTrainer(trainer)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="حذف الحساب نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn dir-rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-5 text-right font-tajawal relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                {editingTrainer ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold font-quran text-slate-900 dark:text-amber-100">
                  {editingTrainer ? 'تعديل بيانات المدرب' : 'إضافة حساب مدرب جديد'}
                </h3>
                <p className="text-xs text-slate-500">
                  تحديد اسم المستخدم، كلمة المرور، وكود الطلاب الخاص به
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTrainer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-800 dark:text-slate-200 font-quran">
                  اسم المدرب / المعلم الكريم: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: الشيخ / د. محمود عبد العزيز"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-quran"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    اسم المستخدم (Username للـ Login): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="مثال: mahmoud"
                    disabled={!!editingTrainer}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    كلمة المرور الخاصة به (الباسورد): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="مثال: 123456 أو كلمة سر خاصة"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    كود الإحالة / كود الطلاب (Referral Code):
                  </label>
                  <input
                    type="text"
                    value={formReferralCode}
                    onChange={(e) => setFormReferralCode(e.target.value)}
                    placeholder="مثال: MAHMOUD-QURAN"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    رقم الهاتف / الواتساب:
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+966..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-800 dark:text-slate-200 font-quran">
                  ملاحظات الترخيص والاشتراك (لك فقط):
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="مثال: اشتراك سنوي - مركز الفرقان القرآني - مدفوع ومعتمد"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-tajawal"
                />
              </div>

              {formError && (
                <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-200 font-bold">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-all font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md font-quran transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'جاري الحفظ...' : editingTrainer ? 'تحديث البيانات' : 'حفظ وتفعيل الحساب'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Quick Modal */}
      {changingPassTrainer && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn dir-rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border-2 border-amber-400 shadow-2xl space-y-4 text-right font-tajawal relative">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-quran text-slate-900 dark:text-amber-100">
                  {changingPassTrainer.role === 'super_admin'
                    ? 'تغيير كلمة مرور المشرف العام (الإدارة المركزية)'
                    : `تغيير كلمة مرور المعلم: ${changingPassTrainer.name}`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {changingPassTrainer.role === 'super_admin'
                    ? 'يتطلب إدخال كلمة المرور الحالية للمصادقة، وسيتم إلغاؤها فوراً واعتماد الجديدة'
                    : 'التحقق من كلمة المرور السابقة وتعيين كلمة المرور الجديدة'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs">
              {/* Old Password Field */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  كلمة المرور الحالية (القديمة): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPasswordVal}
                    onChange={(e) => {
                      setOldPasswordVal(e.target.value);
                      setPassModalError('');
                    }}
                    placeholder="أدخل كلمة المرور الحالية للتأكيد..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-sans font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  كلمة المرور الجديدة المعتمدة: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPasswordVal}
                    onChange={(e) => {
                      setNewPasswordVal(e.target.value);
                      setPassModalError('');
                    }}
                    placeholder="اكتب كلمة المرور الجديدة..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-sans font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {passModalError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passModalError}</span>
                </div>
              )}

              <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 leading-relaxed">
                🔒 تنبيه أمان: سيتم التحقق من كلمة المرور الحالية أولاً، ثم اعتماد الجديدة وإلغاء وإبطال القديمة نهائياً.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChangingPassTrainer(null);
                  setOldPasswordVal('');
                  setNewPasswordVal('');
                  setPassModalError('');
                }}
                disabled={isUpdatingPass}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={isUpdatingPass || !oldPasswordVal.trim() || !newPasswordVal.trim()}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl font-quran cursor-pointer shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isUpdatingPass ? 'جاري التحقق والحفظ...' : 'تأكيد وحفظ الباسورد الجديد'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTrainer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn dir-rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border-2 border-rose-400 shadow-2xl space-y-4 text-center font-tajawal relative">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-quran text-slate-900 dark:text-slate-100">
              تأكيد حذف حساب المدرب: {deleteConfirmTrainer.name}؟
            </h3>
            <p className="text-xs text-slate-500">
              لن يتمكن المدرب بعد ذلك من الدخول للوحة المعلم، وستبقى بيانات طلابه السابقة محفوظة في سجلات المنصة.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTrainer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                تراجع
              </button>
              <button
                onClick={handleDeleteTrainer}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                نعم، احذف الحساب
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
