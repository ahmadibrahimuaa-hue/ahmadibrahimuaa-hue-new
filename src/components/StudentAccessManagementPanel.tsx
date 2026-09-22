import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Filter, Lock, Unlock, CheckCircle2, XCircle, 
  ShieldAlert, ShieldCheck, UserCheck, RefreshCw, PlusCircle, 
  Layers, ArrowUpDown, Check, AlertCircle, Phone, MessageSquare, 
  Sparkles, SlidersHorizontal, BookOpen, Send, UserPlus
} from 'lucide-react';
import { Course } from '../types';
import { getCustomStoredCourses, subscribeCourses } from '../utils/courseCustomStorage';
import { 
  StudentCourseAccessMap, 
  getStoredStudentAccessMap, 
  setStudentCourseAccess, 
  bulkSetCourseAccessForStudents, 
  bulkSetAllCoursesForStudent,
  subscribeStudentAccess,
  DEFAULT_ENROLLED_STUDENTS,
  getExplicitStudentCourseAccess
} from '../utils/studentAccessStorage';
import { getSubmissionsList, getStudentProfile } from '../utils/studentStorage';
import { getWaitlistEntries } from '../utils/waitlistStorage';
import { isCourseUnlocked, getCourseLockDetails } from '../utils/studentProgressStorage';

interface StudentAccessItem {
  id: string;
  name: string;
  email?: string;
  group?: string;
  source: 'profile' | 'waitlist' | 'submission' | 'enrolled' | 'custom';
}

interface StudentAccessManagementPanelProps {
  activeCourseId?: string;
}

export const StudentAccessManagementPanel: React.FC<StudentAccessManagementPanelProps> = ({
  activeCourseId,
}) => {
  const [courses, setCourses] = useState<Course[]>(getCustomStoredCourses());
  const [accessMap, setAccessMap] = useState<StudentCourseAccessMap>(getStoredStudentAccessMap());
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(activeCourseId || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  
  // Selection state for bulk actions
  const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
  const [bulkActionCourseId, setBulkActionCourseId] = useState<string>(
    courses[0]?.id || 'sakinan'
  );

  // New Student Quick Add
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGroup, setNewStudentGroup] = useState('حلقة الإتقان');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const unsubCourses = subscribeCourses((c) => setCourses(c));
    const unsubAccess = subscribeStudentAccess((m) => setAccessMap(m));
    return () => {
      unsubCourses();
      unsubAccess();
    };
  }, []);

  // Compute aggregated list of students from all platform sources
  const allStudents = useMemo<StudentAccessItem[]>(() => {
    const studentMap = new Map<string, StudentAccessItem>();

    // 1. Pre-enrolled sample cohort
    DEFAULT_ENROLLED_STUDENTS.forEach((s) => {
      studentMap.set(s.name.trim(), {
        id: `enrolled-${s.name}`,
        name: s.name.trim(),
        email: s.email,
        group: s.group,
        source: 'enrolled',
      });
    });

    // 2. Active logged-in profile
    const activeProfile = getStudentProfile();
    if (activeProfile?.name) {
      const name = activeProfile.name.trim();
      studentMap.set(name, {
        id: `profile-${name}`,
        name,
        email: undefined,
        group: 'حساب الطالب النشط حالياً 👤',
        source: 'profile',
      });
    }

    // 3. Submissions records
    try {
      const submissions = getSubmissionsList();
      submissions.forEach((sub) => {
        if (sub.studentName && sub.studentName.trim()) {
          const name = sub.studentName.trim();
          if (!studentMap.has(name)) {
            studentMap.set(name, {
              id: `sub-${name}`,
              name,
              group: 'مشارك في الاختبارات والتدريبات',
              source: 'submission',
            });
          }
        }
      });
    } catch (e) {
      console.warn('Could not load submissions for student list:', e);
    }

    // 4. Waitlist entries
    try {
      const waitlist = getWaitlistEntries();
      waitlist.forEach((w) => {
        if (w.studentName && w.studentName.trim()) {
          const name = w.studentName.trim();
          if (!studentMap.has(name)) {
            studentMap.set(name, {
              id: `waitlist-${w.id || name}`,
              name,
              email: w.phone ? `هاتف: ${w.phone}` : undefined,
              group: w.status === 'approved' ? 'طالب معتمد (قائمة الانتظار)' : 'مسجل في قائمة الانتظار',
              source: 'waitlist',
            });
          }
        }
      });
    } catch (e) {
      console.warn('Could not load waitlist for student list:', e);
    }

    // 5. Any students that already have explicit overrides in accessMap
    Object.keys(accessMap).forEach((name) => {
      const clean = name.trim();
      if (clean && !studentMap.has(clean)) {
        studentMap.set(clean, {
          id: `access-${clean}`,
          name: clean,
          group: 'طالب مخصص في لوحة التحكم',
          source: 'custom',
        });
      }
    });

    return Array.from(studentMap.values());
  }, [accessMap]);

  // Unique groups for filter dropdown
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach((s) => {
      if (s.group) set.add(s.group);
    });
    return Array.from(set);
  }, [allStudents]);

  // Helper to determine status of a student for a course
  const getStudentCourseStatus = (studentName: string, course: Course): { isUnlocked: boolean; isOverride: boolean } => {
    const explicit = getExplicitStudentCourseAccess(studentName, course.id);
    if (typeof explicit === 'boolean') {
      return { isUnlocked: explicit, isOverride: true };
    }
    // Fallback default
    const fallbackUnlocked = isCourseUnlocked(course.id, false, course);
    return { isUnlocked: fallbackUnlocked, isOverride: false };
  };

  // Filter students based on search and selected filters
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesGroup = (student.group || '').toLowerCase().includes(q);
        const matchesEmail = (student.email || '').toLowerCase().includes(q);
        if (!matchesName && !matchesGroup && !matchesEmail) return false;
      }

      // 2. Group Filter
      if (groupFilter !== 'all' && student.group !== groupFilter) {
        return false;
      }

      // 3. Status Filter (dependent on selectedCourseFilter or any course)
      if (statusFilter !== 'all') {
        if (selectedCourseFilter !== 'all') {
          const targetCourse = courses.find((c) => c.id === selectedCourseFilter);
          if (targetCourse) {
            const { isUnlocked } = getStudentCourseStatus(student.name, targetCourse);
            if (statusFilter === 'unlocked' && !isUnlocked) return false;
            if (statusFilter === 'locked' && isUnlocked) return false;
          }
        } else {
          // Check if at least one course matches the status
          const hasMatchingStatus = courses.some((c) => {
            const { isUnlocked } = getStudentCourseStatus(student.name, c);
            return statusFilter === 'unlocked' ? isUnlocked : !isUnlocked;
          });
          if (!hasMatchingStatus) return false;
        }
      }

      return true;
    });
  }, [allStudents, searchQuery, groupFilter, statusFilter, selectedCourseFilter, courses, accessMap]);

  // Toggle single student course access
  const handleToggleAccess = async (studentName: string, course: Course) => {
    const { isUnlocked } = getStudentCourseStatus(studentName, course);
    const nextState = !isUnlocked;
    await setStudentCourseAccess(studentName, course.id, nextState);
    showToast(
      `تم ${nextState ? 'فتح 🔓' : 'قفل 🔒'} (${course.title}) للطالب (${studentName}) فوراً.`,
      nextState ? 'success' : 'info'
    );
  };

  // Bulk: Toggle or set for all selected students
  const handleBulkSetCourse = async (isUnlocked: boolean) => {
    const targetCourse = courses.find((c) => c.id === bulkActionCourseId) || courses[0];
    if (!targetCourse) return;

    const namesToUpdate = selectedStudentNames.length > 0 
      ? selectedStudentNames 
      : filteredStudents.map((s) => s.name);

    if (namesToUpdate.length === 0) {
      showToast('يرجى تحديد طالب واحد على الأقل.', 'error');
      return;
    }

    await bulkSetCourseAccessForStudents(namesToUpdate, targetCourse.id, isUnlocked);
    showToast(
      `تم بنجاح ${isUnlocked ? 'فتح 🔓' : 'قفل 🔒'} (${targetCourse.title}) لـ (${namesToUpdate.length}) طالباً.`,
      'success'
    );
  };

  // Bulk: Open or lock ALL courses for selected students
  const handleBulkSetAllCourses = async (isUnlocked: boolean) => {
    const namesToUpdate = selectedStudentNames.length > 0 
      ? selectedStudentNames 
      : filteredStudents.map((s) => s.name);

    if (namesToUpdate.length === 0) {
      showToast('يرجى تحديد طالب واحد على الأقل.', 'error');
      return;
    }

    const courseIds = courses.map((c) => c.id);
    for (const name of namesToUpdate) {
      await bulkSetAllCoursesForStudent(name, courseIds, isUnlocked);
    }

    showToast(
      `تم ${isUnlocked ? 'فتح كافة الحقائب 🔓' : 'قفل كافة الحقائب 🔒'} لـ (${namesToUpdate.length}) طالباً بنجاح.`,
      'success'
    );
  };

  // Selection toggle
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentNames(filteredStudents.map((s) => s.name));
    } else {
      setSelectedStudentNames([]);
    }
  };

  const handleToggleSelectStudent = (studentName: string) => {
    setSelectedStudentNames((prev) => 
      prev.includes(studentName) 
        ? prev.filter((n) => n !== studentName) 
        : [...prev, studentName]
    );
  };

  // Add new student quickly
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const clean = newStudentName.trim();
    // Default open sakinan, lock others
    await setStudentCourseAccess(clean, 'sakinan', true);
    setNewStudentName('');
    setIsAddingStudent(false);
    showToast(`تمت إضافة الطالب (${clean}) وتجهيز ملف الصلاحيات الخاص به بنجاح!`, 'success');
  };

  // Render course columns based on selected filter
  const displayedCourses = useMemo(() => {
    if (selectedCourseFilter !== 'all') {
      const match = courses.find((c) => c.id === selectedCourseFilter);
      return match ? [match] : courses;
    }
    return courses;
  }, [courses, selectedCourseFilter]);

  return (
    <div className="space-y-6 font-tajawal dir-rtl text-slate-100">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xl border animate-slideDown ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 text-emerald-200 border-emerald-400' 
            : toastMessage.type === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-500'
            : 'bg-amber-950 text-amber-200 border-amber-400'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-5 rounded-3xl border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-quran text-amber-300">
              إدارة صلاحيات وصول وقفل الحقائب للطلاب
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              تحكم كامل ومباشر في قفل الحقيبة أو فتحها لأي طالب على حدة، مع إمكانية التعديل الجماعي الفوري.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsAddingStudent(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب جديد للقائمة</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar (Requirement 1 & 4) */}
      <div className="bg-slate-900/90 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
          <SlidersHorizontal className="w-4 h-4" />
          <span>شريط البحث والفلترة السريعة:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. Search query input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو البريد أو الحلقة..."
              className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 2. Course Filter Dropdown */}
          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">📚 عرض كافة الحقائب التجويدية ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.parentCourseId ? '↳ (حقيبة فرعية)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Status Filter Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">🔍 جميع الحالات (مفتوحة ومقفلة)</option>
              <option value="unlocked">🟢 مفتوحة فقط للطلاب</option>
              <option value="locked">🔒 مقفلة فقط للطلاب</option>
            </select>
          </div>

          {/* 4. Group / Cohort Filter */}
          <div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">👥 جميع الحلقات والدفعات ({allStudents.length} طالباً)</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Controls Ribbon */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Select all checkbox and counter */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-bold hover:text-white">
              <input
                type="checkbox"
                checked={filteredStudents.length > 0 && selectedStudentNames.length === filteredStudents.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-600 cursor-pointer"
              />
              <span>تحديد الكل ({filteredStudents.length} طالباً)</span>
            </label>

            {selectedStudentNames.length > 0 && (
              <span className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-bold">
                تم تحديد {selectedStudentNames.length} طالب
              </span>
            )}
          </div>

          {/* Bulk operation buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold">إجراء جماعي:</span>
            
            <select
              value={bulkActionCourseId}
              onChange={(e) => setBulkActionCourseId(e.target.value)}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-amber-300 font-bold"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortTitle || c.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleBulkSetCourse(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl font-bold cursor-pointer transition-all"
              title="فتح الحقيبة المحددة لجميع الطلاب المحددين"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>فتح الحقيبة جماعياً 🔓</span>
            </button>

            <button
              onClick={() => handleBulkSetCourse(false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-400/40 rounded-xl font-bold cursor-pointer transition-all"
              title="قفل الحقيبة المحددة لجميع الطلاب المحددين"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>قفل الحقيبة جماعياً 🔒</span>
            </button>

            <button
              onClick={() => handleBulkSetAllCourses(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40 rounded-xl font-bold cursor-pointer transition-all"
              title="فتح جميع الحقائب للطلاب المحددين"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>فتح كافة الحقائب ✨</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Grid of Students & Access Controls */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">لا يوجد طلاب يطابقون معايير البحث والفلترة</h3>
            <p className="text-xs text-slate-500">جرب تعديل شريط البحث أو اختيار فلتر آخر.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCourseFilter('all');
                setStatusFilter('all');
                setGroupFilter('all');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl transition-all"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudentNames.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 min-w-[200px]">اسم الطالب والحلقة</th>
                  {displayedCourses.map((course) => (
                    <th key={course.id} className="p-4 min-w-[170px] text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-bold">{course.shortTitle || course.title}</span>
                        {course.parentCourseId && (
                          <span className="text-[10px] text-amber-400 font-normal">↳ فرعية مدمجة</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-4 min-w-[130px] text-center">الإجراءات السريعة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudentNames.includes(student.name);

                  return (
                    <tr 
                      key={student.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-amber-400/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student.name)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-600 cursor-pointer"
                        />
                      </td>

                      {/* Student info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                            {student.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{student.name}</span>
                              {student.source === 'profile' && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30">
                                  أنت الآن
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {student.group || 'طالب مسجل'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course Access Columns (Requirement 2 & 4) */}
                      {displayedCourses.map((course) => {
                        const { isUnlocked, isOverride } = getStudentCourseStatus(student.name, course);

                        return (
                          <td key={course.id} className="p-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              
                              {/* Visual status badge */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                                isUnlocked 
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-sm'
                                  : 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-sm'
                              }`}>
                                {isUnlocked ? (
                                  <>
                                    <Unlock className="w-3 h-3 text-emerald-400" />
                                    <span>مفتوحة 🟢</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 text-rose-400" />
                                    <span>مقفلة 🔒</span>
                                  </>
                                )}
                              </span>

                              {/* Quick Toggle Button Switch (Requirement 2) */}
                              <button
                                onClick={() => handleToggleAccess(student.name, course)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                                  isUnlocked ? 'bg-emerald-500' : 'bg-slate-700'
                                }`}
                                title={`انقر لـ ${isUnlocked ? 'قفل' : 'فتح'} هذه الحقيبة للطالب`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isUnlocked ? 'translate-x-1' : 'translate-x-6'
                                  }`}
                                />
                              </button>

                              {/* Tag if explicit teacher decision */}
                              {isOverride && (
                                <span className="text-[9px] text-amber-400 font-mono">
                                  قرار المعلم 🔑
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Quick student actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={async () => {
                              const courseIds = courses.map((c) => c.id);
                              await bulkSetAllCoursesForStudent(student.name, courseIds, true);
                              showToast(`تم فتح جميع الحقائب لـ (${student.name}) 🔓`, 'success');
                            }}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                            title="فتح كافة الحقائب لهذا الطالب"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              const courseIds = courses.map((c) => c.id);
                              await bulkSetAllCoursesForStudent(student.name, courseIds, false);
                              showToast(`تم قفل جميع الحقائب لـ (${student.name}) 🔒`, 'info');
                            }}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                            title="قفل كافة الحقائب لهذا الطالب"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Quick Add Student */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border-2 border-amber-400 shadow-2xl font-tajawal text-right dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>إضافة طالب جديد للائحة الصلاحيات</span>
              </h3>
              <button
                onClick={() => setIsAddingStudent(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم الطالب الثلاثي أو المستعار:</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="مثال: عبد الرحمن بن صالح"
                  required
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الحلقة / الدفعة الدراسية:</label>
                <input
                  type="text"
                  value={newStudentGroup}
                  onChange={(e) => setNewStudentGroup(e.target.value)}
                  placeholder="مثال: حلقة الإتقان المسائية"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-400 text-slate-950 font-extrabold rounded-xl hover:bg-amber-300 shadow-md cursor-pointer"
                >
                  إضافة الطالب وتفعيل التحكم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
