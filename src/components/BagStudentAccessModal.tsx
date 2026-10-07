import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Check, Lock, Unlock, Users, Search, UserPlus, 
  KeyRound, ShieldCheck, AlertCircle, Sparkles, Filter, 
  RefreshCw, CheckCircle2, UserCheck, SlidersHorizontal, BookOpen
} from 'lucide-react';
import { Course } from '../types';
import { 
  getStoredBagAccessModes, 
  getBagAccessMode, 
  setBagAccessMode, 
  BagAccessMode, 
  getStoredStudentAccessMap, 
  setStudentCourseAccess, 
  bulkSetCourseAccessForStudents, 
  DEFAULT_ENROLLED_STUDENTS, 
  StudentCourseAccessMap, 
  subscribeStudentAccess,
  getStudentEffectiveCourseAccess 
} from '../utils/studentAccessStorage';
import { getStudentProfile, getSubmissionsList } from '../utils/studentStorage';
import { getWaitlistEntries } from '../utils/waitlistStorage';

interface BagStudentAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onNotify?: (msg: string, isError?: boolean) => void;
}

export const BagStudentAccessModal: React.FC<BagStudentAccessModalProps> = ({
  isOpen,
  onClose,
  course,
  onNotify,
}) => {
  const [accessMap, setAccessMap] = useState<StudentCourseAccessMap>(() => getStoredStudentAccessMap());
  const [currentMode, setCurrentMode] = useState<BagAccessMode>(() => {
    if (!course) return 'all_unlocked';
    const defaultMode = course.status === 'locked' ? 'all_locked' : 'all_unlocked';
    return getBagAccessMode(course.id, defaultMode);
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterState, setFilterState] = useState<'all' | 'granted' | 'locked'>('all');
  
  // Quick Add Student
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentGroup, setNewStudentGroup] = useState<string>('حلقة الإتقان');

  useEffect(() => {
    const unsub = subscribeStudentAccess((m) => {
      setAccessMap(m);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!course) return;
    const defaultMode = course.status === 'locked' ? 'all_locked' : 'all_unlocked';
    setCurrentMode(getBagAccessMode(course.id, defaultMode));
  }, [course?.id, course?.status]);

  // Aggregate all enrolled & active students
  const allStudents = useMemo(() => {
    const map = new Map<string, { name: string; email?: string; group: string }>();
    DEFAULT_ENROLLED_STUDENTS.forEach((s) => map.set(s.name.trim(), { name: s.name.trim(), email: s.email, group: s.group }));
    
    const profile = getStudentProfile();
    if (profile?.name && profile.name.trim()) {
      const pName = profile.name.trim();
      map.set(pName, { name: pName, email: undefined, group: 'الطالب الحالي المسجل 👤' });
    }

    Object.keys(accessMap).forEach((name) => {
      const clean = name.trim();
      if (clean && !map.has(clean)) {
        map.set(clean, { name: clean, email: undefined, group: 'طالب مخصص' });
      }
    });

    getSubmissionsList().forEach((sub) => {
      if (sub.studentName && sub.studentName.trim()) {
        const clean = sub.studentName.trim();
        if (!map.has(clean)) {
          map.set(clean, { name: clean, email: undefined, group: sub.trainerName ? `حلقة المعلم: ${sub.trainerName}` : 'حلقة عامة' });
        }
      }
    });

    getWaitlistEntries().forEach((w) => {
      if (w.studentName && w.studentName.trim()) {
        const clean = w.studentName.trim();
        if (!map.has(clean)) {
          map.set(clean, { name: clean, email: undefined, group: 'قائمة الانتظار' });
        }
      }
    });

    return Array.from(map.values());
  }, [accessMap]);

  // Compute student access statuses
  const evaluatedStudents = useMemo(() => {
    if (!course) return [];
    return allStudents.map((s) => {
      const effective = getStudentEffectiveCourseAccess(s.name, course.id, course.status || 'available');
      return {
        ...s,
        isUnlocked: effective.isUnlocked,
        reason: effective.reason,
      };
    });
  }, [allStudents, course?.id, course?.status, accessMap, currentMode]);

  // Filter students by search and filter state
  const filteredStudents = useMemo(() => {
    return evaluatedStudents.filter((s) => {
      if (filterState === 'granted' && !s.isUnlocked) return false;
      if (filterState === 'locked' && s.isUnlocked) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchGroup = s.group.toLowerCase().includes(q);
        if (!matchName && !matchGroup) return false;
      }
      return true;
    });
  }, [evaluatedStudents, filterState, searchQuery]);

  if (!isOpen || !course) return null;

  const grantedCount = evaluatedStudents.filter((s) => s.isUnlocked).length;
  const lockedCount = evaluatedStudents.filter((s) => !s.isUnlocked).length;

  const handleModeChange = (mode: BagAccessMode) => {
    setCurrentMode(mode);
    setBagAccessMode(course.id, mode);
    if (onNotify) {
      onNotify(
        mode === 'all_unlocked'
          ? 'تم ضبط الحقيبة: مفتوحة لجميع الطلاب تلقائياً 🟢'
          : mode === 'selective_locked'
          ? 'تم ضبط الحقيبة: مخصصة لطلاب محددين (مقفلة افتراضياً وتفتح بالاسم) 🎯'
          : 'تم ضبط الحقيبة: مقفلة على جميع الطلاب 🔒'
      );
    }
  };

  const handleToggleStudent = async (studentName: string) => {
    const student = evaluatedStudents.find((s) => s.name === studentName);
    const nextVal = !student?.isUnlocked;
    await setStudentCourseAccess(studentName, course.id, nextVal);
    if (onNotify) {
      onNotify(
        nextVal
          ? `تم فتح الحقيبة خصيصاً للطالب: "${studentName}" 🔑`
          : `تم قفل الحقيبة عن الطالب: "${studentName}" 🔒`
      );
    }
  };

  const handleBatchToggleAll = async (unlockAll: boolean) => {
    const names = allStudents.map((s) => s.name);
    await bulkSetCourseAccessForStudents(names, course.id, unlockAll);
    if (onNotify) {
      onNotify(
        unlockAll
          ? `تم منح صلاحية الفتح لجميع الطلاب المسجلين (${names.length} طالباً) 🔓`
          : `تم قفل الحقيبة على جميع الطلاب المسجلين 🔒`
      );
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const cleanName = newStudentName.trim();
    await setStudentCourseAccess(cleanName, course.id, true);
    setNewStudentName('');
    setShowAddForm(false);
    if (onNotify) {
      onNotify(`تمت إضافة الطالب "${cleanName}" ومنحه صلاحية فتح الحقيبة بنجاح! 🔑`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn font-tajawal dir-rtl text-right">
      <div className="bg-slate-900 border-2 border-indigo-500/50 text-slate-100 rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 space-y-6 relative max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold font-quran text-amber-300">
                  تخصيص صلاحيات الحقيبة للطلاب
                </h3>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {course.badge || 'حقيبة تجويدية'}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5 font-quran">
                الحقيبة المستهدفة: <span className="font-bold text-slate-100">{course.title}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Main Area */}
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          
          {/* Section 1: General Access Policy (الوضع العام للحقيبة) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-quran flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>السياسة العامة للحقيبة (الوضع الافتراضي):</span>
              </span>
              <span className="text-[10px] text-slate-400">
                اختر كيف يتعامل النظام مع الطلاب غير المحددين
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Card 1: All Unlocked */}
              <button
                type="button"
                onClick={() => handleModeChange('all_unlocked')}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  currentMode === 'all_unlocked'
                    ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-quran text-emerald-300 flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>مفتوحة للجميع تلقائياً 🟢</span>
                  </span>
                  {currentMode === 'all_unlocked' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  متاحة لكافة الطلاب المسجلين بالمنصة تلقائياً، مع إمكانية قفلها عن طالب بعينه.
                </p>
              </button>

              {/* Card 2: Selective Locked (Locked by default, granted per student) */}
              <button
                type="button"
                onClick={() => handleModeChange('selective_locked')}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  currentMode === 'selective_locked'
                    ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-quran text-amber-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>مخصصة لطلاب محددين 🎯</span>
                  </span>
                  {currentMode === 'selective_locked' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  مقفلة افتراضياً عن الجميع، ولا تفتح إلا للطالب الذي تمنحه المفتاح الأخضر 🔑 أدناه.
                </p>
              </button>

              {/* Card 3: All Locked */}
              <button
                type="button"
                onClick={() => handleModeChange('all_locked')}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  currentMode === 'all_locked'
                    ? 'bg-rose-950/80 border-rose-400 ring-2 ring-rose-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-quran text-rose-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>مقفلة على الجميع 🔒</span>
                  </span>
                  {currentMode === 'all_locked' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  معطلة ومغلقة تماماً في المنصة لجميع الطلاب حتى إشعار آخر.
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Quick Batch Actions & Add Student Bar */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-300 font-quran">
                إجراءات سريعة على كامل الدفعة:
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBatchToggleAll(true)}
                  className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-600/60 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Unlock className="w-3 h-3" />
                  <span>فتح لجميع الطلاب 🔓</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchToggleAll(false)}
                  className="bg-rose-950/70 hover:bg-rose-900 text-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-700/60 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>قفل على جميع الطلاب 🔒</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-600/60 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>إضافة طالب جديد</span>
                </button>
              </div>
            </div>

            {/* Quick Add Student Form */}
            {showAddForm && (
              <form onSubmit={handleAddStudent} className="pt-2 border-t border-slate-800 flex items-center gap-2 flex-wrap animate-fadeIn">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="اسم الطالب الجديد (مثال: عبد الرحمن السعيد)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-tajawal"
                />
                <input
                  type="text"
                  value={newStudentGroup}
                  onChange={(e) => setNewStudentGroup(e.target.value)}
                  placeholder="اسم الحلقة..."
                  className="w-36 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-tajawal"
                />
                <button
                  type="submit"
                  disabled={!newStudentName.trim()}
                  className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>إضافة ومنح الإذن 🔑</span>
                </button>
              </form>
            )}
          </div>

          {/* Section 3: Filter & Search Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الطالب أو الحلقة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-tajawal"
              />
              <Search className="w-4 h-4 text-slate-500 absolute top-2.5 right-3" />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterState('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold cursor-pointer ${
                  filterState === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({evaluatedStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterState('granted')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold cursor-pointer ${
                  filterState === 'granted' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                المصرح لهم 🔑 ({grantedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterState('locked')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold cursor-pointer ${
                  filterState === 'locked' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                المقفلة عنهم 🔒 ({lockedCount})
              </button>
            </div>
          </div>

          {/* Section 4: Students List with Live Toggle Switches */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs space-y-1">
                <Users className="w-6 h-6 mx-auto opacity-50" />
                <p>لا يوجد طلاب يطابقون معايير البحث الحالية.</p>
              </div>
            ) : (
              filteredStudents.map((s) => {
                return (
                  <div
                    key={s.name}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      s.isUnlocked
                        ? 'bg-emerald-950/20 border-emerald-800/60 hover:border-emerald-600'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        s.isUnlocked ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-100 font-quran">{s.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {s.group}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.isUnlocked ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>مصرح له بالدخول لهذه الحقيبة</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>مقفلة عن هذا الطالب</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Instant Access Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStudent(s.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        s.isUnlocked
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-600'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-600'
                      }`}
                      title={s.isUnlocked ? 'انقر لقفل الحقيبة عن هذا الطالب' : 'انقر لفتح الحقيبة لهذا الطالب'}
                    >
                      {s.isUnlocked ? (
                        <>
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                          <span>مفتوحة 🔑 (انقر للقفل)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>مقفلة 🔒 (انقر للفتح)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
          <div className="text-xs text-slate-400">
            الحالة: <span className="font-bold text-amber-300">{grantedCount}</span> طلاب مصرح لهم بدخول الحقيبة من أصل {allStudents.length}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-quran px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
          >
            تم الحفظ والإغلاق ✓
          </button>
        </div>

      </div>
    </div>
  );
};
