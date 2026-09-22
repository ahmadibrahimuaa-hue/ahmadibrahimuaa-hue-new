import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  Phone, 
  MessageSquare, 
  Lock, 
  Unlock, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  UserPlus, 
  BookOpen, 
  ShieldCheck,
  CreditCard,
  Check
} from 'lucide-react';
import { 
  WaitlistEntry, 
  subscribeWaitlistEntries, 
  approveAndUnlockStudent, 
  revokeAndRelockStudent, 
  deleteWaitlistEntry,
  joinCourseWaitlist
} from '../utils/waitlistStorage';
import { ALL_COURSES } from '../data/courses';

interface TeacherWaitlistPanelProps {
  activeCourseId?: string;
}

export const TeacherWaitlistPanel: React.FC<TeacherWaitlistPanelProps> = ({ activeCourseId }) => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Manual Enrollment Form Modal/Collapse
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentPhone, setNewStudentPhone] = useState<string>('');
  const [newSelectedCourse, setNewSelectedCourse] = useState<string>(activeCourseId || 'sakinan');
  const [newAutoUnlock, setNewAutoUnlock] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeWaitlistEntries((list) => {
      setEntries(list);
    });
    return () => unsub();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const handleApprove = async (entry: WaitlistEntry) => {
    const id = entry.id || entry.studentName;
    setActionLoadingId(id);
    const ok = await approveAndUnlockStudent(entry);
    setActionLoadingId(null);
    if (ok) {
      showNotification(`✓ تم تأكيد دفع الرسوم وفتح حقيبة (${entry.courseTitle}) للطالب (${entry.studentName}) بنجاح!`);
    } else {
      alert('حدث خطأ أثناء تفعيل الحقيبة، يرجى المحاولة ثانية');
    }
  };

  const handleRevoke = async (entry: WaitlistEntry) => {
    if (!window.confirm(`هل أنت متأكد من قفل حقيبة (${entry.courseTitle}) للطالب (${entry.studentName}) مجدداً؟`)) {
      return;
    }
    const id = entry.id || entry.studentName;
    setActionLoadingId(id);
    const ok = await revokeAndRelockStudent(entry);
    setActionLoadingId(null);
    if (ok) {
      showNotification(`تم قفل الحقيبة للطالب (${entry.studentName}) بنجاح.`);
    }
  };

  const handleDelete = async (entry: WaitlistEntry) => {
    if (!window.confirm(`هل تريد حذف طلب الطالب (${entry.studentName}) نهائياً من القائمة؟`)) {
      return;
    }
    if (entry.id) {
      await deleteWaitlistEntry(entry.id);
      showNotification(`تم حذف الطلب بنجاح.`);
    }
  };

  const handleManualAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      alert('يرجى إدخال اسم الطالب');
      return;
    }

    setIsAdding(true);
    const courseObj = ALL_COURSES.find((c) => c.id === newSelectedCourse) || ALL_COURSES[0];
    await joinCourseWaitlist(
      courseObj.id,
      courseObj.title,
      newStudentPhone.trim(),
      'تسجيل يدوي بواسطة المعلم المشرف'
    );

    if (newAutoUnlock) {
      const now = Date.now();
      await approveAndUnlockStudent({
        courseId: courseObj.id,
        courseTitle: courseObj.title,
        studentName: newStudentName.trim(),
        phone: newStudentPhone.trim(),
        status: 'approved',
        paymentStatus: 'paid',
        registeredAt: new Date().toLocaleDateString('ar-EG'),
        timestamp: now,
      });
      showNotification(`✓ تم تسجيل الطالب (${newStudentName.trim()}) وفتح الحقيبة له مباشرة!`);
    } else {
      showNotification(`تمت إضافة الطالب (${newStudentName.trim()}) لقائمة الانتظار بنجاح.`);
    }

    setNewStudentName('');
    setNewStudentPhone('');
    setIsAdding(false);
    setShowAddModal(false);
  };

  // Filtered entries
  const filteredEntries = entries.filter((item) => {
    if (filterStatus === 'pending' && item.status !== 'pending') return false;
    if (filterStatus === 'approved' && item.status !== 'approved') return false;
    if (filterCourse !== 'all' && item.courseId !== filterCourse) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.studentName || '').toLowerCase().includes(q);
      const matchPhone = (item.phone || '').toLowerCase().includes(q);
      const matchCourse = (item.courseTitle || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCourse) return false;
    }
    return true;
  });

  const pendingCount = entries.filter((e) => e.status === 'pending').length;
  const approvedCount = entries.filter((e) => e.status === 'approved').length;

  return (
    <div className="space-y-6 font-tajawal dir-rtl">
      
      {/* Toast Banner */}
      {successMsg && (
        <div className="bg-emerald-900/90 border-2 border-emerald-400 text-emerald-100 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
            <span className="font-bold font-quran text-sm">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-300 hover:text-white text-xs px-2 py-1 bg-emerald-950/60 rounded-lg"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Header Info & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-quran">إجمالي طلبات الانضمام</div>
            <div className="text-2xl font-black font-quran text-slate-100 mt-1">{entries.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className={`rounded-2xl p-4 border flex items-center justify-between transition-all ${
          pendingCount > 0 
            ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/40' 
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div>
            <div className="text-xs text-amber-300 font-bold font-quran flex items-center gap-1.5">
              <span>بانتظار التحويل والتفعيل</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </div>
            <div className="text-2xl font-black font-quran text-amber-400 mt-1">{pendingCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-quran">الحقائب المفعلة للدارسين</div>
            <div className="text-2xl font-black font-quran text-emerald-400 mt-1">{approvedCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="بحث باسم الطالب، رقم الهاتف، أو اسم الحقيبة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'all' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل ({entries.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterStatus === 'pending' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>بانتظار التحويل</span>
            {pendingCount > 0 && (
              <span className="bg-amber-900 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'approved' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            تم التفعيل ({approvedCount})
          </button>
        </div>

        {/* Course Filter Dropdown */}
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="all">جميع الحقائب التدريبية</option>
          {ALL_COURSES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortTitle || c.title}
            </option>
          ))}
        </select>

        {/* Add Student Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-emerald-600/60"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة طالب يدوي</span>
        </button>

      </div>

      {/* Manual Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-600/80 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black font-quran text-amber-300 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>إضافة طالب وتفعيل حقيبة يدوياً</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold font-quran text-slate-300 mb-1">
                  اسم الطالب الكامل:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف أحمد عبد الله"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-quran text-slate-300 mb-1">
                  رقم الهاتف / الواتساب (اختياري للتواصل):
                </label>
                <input
                  type="text"
                  placeholder="مثال: 0501234567"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-quran text-slate-300 mb-1">
                  الحقيبة التدريبية:
                </label>
                <select
                  value={newSelectedCourse}
                  onChange={(e) => setNewSelectedCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  {ALL_COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <label htmlFor="autoUnlock" className="text-xs text-slate-300 font-bold font-quran cursor-pointer">
                  فتح الحقيبة مباشرة للطالب (تم استلام الرسوم)
                </label>
                <input
                  id="autoUnlock"
                  type="checkbox"
                  checked={newAutoUnlock}
                  onChange={(e) => setNewAutoUnlock(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold rounded-xl font-quran cursor-pointer shadow-md"
                >
                  {isAdding ? 'جارٍ الإضافة...' : 'حفظ وتسجيل الطالب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center text-2xl">
            📋
          </div>
          <h4 className="text-base font-bold font-quran text-slate-300">
            لا توجد طلبات انضمام مطابقة للبحث
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            عندما يقوم أي طالب بالضغط على "الانضمام لقائمة الانتظار" أو طلب الاشتراك في حقيبة مدفوعة، سيظهر اسمه وبياناته هنا فوراً لتتمكن من التواصل معه وتأكيد الرسوم وفتح الحقيبة له.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredEntries.map((entry) => {
            const isLoading = actionLoadingId === (entry.id || entry.studentName);
            const isApproved = entry.status === 'approved';
            
            // Clean phone for whatsapp
            const rawPhone = (entry.phone || '').replace(/[^0-9+]/g, '');
            const whatsappUrl = rawPhone
              ? `https://wa.me/${rawPhone.startsWith('+') ? rawPhone.substring(1) : rawPhone}?text=${encodeURIComponent(
                  `السلام عليكم ورحمة الله وبركاته، مرحباً بك يا ${entry.studentName}. بخصوص طلب التحاقك بحقيبة (${entry.courseTitle}) في منصة تيسير علم التجويد...`
                )}`
              : null;

            return (
              <div
                key={entry.id || `${entry.courseId}_${entry.studentName}`}
                className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                  isApproved
                    ? 'bg-slate-900/80 border-emerald-800/60 text-slate-200'
                    : 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/50 shadow-md text-slate-100'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  {/* Student & Course Info */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 border ${
                        isApproved
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-600/60'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {entry.studentName.charAt(0) || 'ط'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold font-quran text-slate-100">
                          {entry.studentName}
                        </span>

                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-600/50 font-quran">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>تم التحويل والدفع (الحقيبة مفتوحة)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-quran animate-pulse">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>بانتظار تأكيد التحويل والتفعيل ⏳</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-amber-200 font-bold font-quran">
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span>الحقيبة: {entry.courseTitle}</span>
                        </span>

                        {entry.phone && (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-mono">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span dir="ltr">{entry.phone}</span>
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500">
                          تاريخ التسجيل: {entry.registeredAt}
                        </span>
                      </div>

                      {entry.notes && (
                        <p className="text-[11px] text-slate-400 italic">
                          ملاحظات: {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    
                    {/* WhatsApp Quick Chat */}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="مراسلة الطالب عبر واتساب للتنسيق والدفع"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>مراسلة واتساب</span>
                      </a>
                    )}

                    {/* Primary Unlock/Revoke Toggle */}
                    {isApproved ? (
                      <button
                        onClick={() => handleRevoke(entry)}
                        disabled={isLoading}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        title="إعادة قفل الحقيبة على هذا الطالب"
                      >
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>قفل الحقيبة</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(entry)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black font-quran px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105"
                        title="تأكيد تحويل الرسوم وفتح الحقيبة للطالب فوراً"
                      >
                        <Unlock className="w-4 h-4 text-slate-950" />
                        <span>{isLoading ? 'جارٍ التفعيل...' : 'تأكيد التحويل وفتح الحقيبة 🔑'}</span>
                      </button>
                    )}

                    {/* Delete entry */}
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="حذف من القائمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
