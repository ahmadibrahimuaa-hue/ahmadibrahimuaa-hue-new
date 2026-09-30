import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, MessageSquare, AlertCircle, CheckCircle2, Search, Filter, 
  HelpCircle, Sparkles, TrendingUp, Users, BookOpen, RefreshCw, 
  Award, ArrowUpRight, Calendar, UserCheck, MessageCircle, Download
} from 'lucide-react';
import { 
  getAllStudentReflectionsList, 
  subscribeSelfReflections, 
  LessonSelfReflection, 
  REFLECTION_RATINGS 
} from '../utils/selfReflectionStorage';
import { getAllCourses, getCourseById } from '../data/courses';
import { Course } from '../types';

interface TeacherSelfReflectionTabProps {
  activeCourseId?: string;
}

export const TeacherSelfReflectionTab: React.FC<TeacherSelfReflectionTabProps> = ({
  activeCourseId = 'all',
}) => {
  const [reflections, setReflections] = useState<LessonSelfReflection[]>(getAllStudentReflectionsList());
  const [courses, setCourses] = useState<Course[]>(getAllCourses());
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(activeCourseId || 'all');
  const [ratingFilter, setRatingFilter] = useState<string>('all'); // 'all' | '1' | '2' | '3' | '4' | '5' | 'low' (1-2) | 'high' (4-5)
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeSelfReflections((list) => {
      setReflections(list);
    });
    return () => unsub();
  }, []);

  const handleRefresh = () => {
    setReflections(getAllStudentReflectionsList());
  };

  // Filtered reflections
  const filteredReflections = useMemo(() => {
    return reflections.filter((ref) => {
      // Course filter
      if (selectedCourseFilter !== 'all' && ref.courseId !== selectedCourseFilter) {
        return false;
      }

      // Rating filter
      if (ratingFilter === 'low' && ref.rating > 2) return false;
      if (ratingFilter === 'high' && ref.rating < 4) return false;
      if (['1', '2', '3', '4', '5'].includes(ratingFilter) && ref.rating.toString() !== ratingFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const studentMatch = ref.studentName.toLowerCase().includes(q);
        const lessonMatch = ref.lessonTitle.toLowerCase().includes(q);
        const unitMatch = ref.unitTitle.toLowerCase().includes(q);
        const noteMatch = (ref.note || '').toLowerCase().includes(q);
        if (!studentMatch && !lessonMatch && !unitMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    });
  }, [reflections, selectedCourseFilter, ratingFilter, searchQuery]);

  // High-level statistics
  const stats = useMemo(() => {
    const total = reflections.length;
    if (total === 0) {
      return { total: 0, avgRating: 0, lowCount: 0, highCount: 0, uniqueStudents: 0 };
    }
    const sum = reflections.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = (sum / total).toFixed(1);
    const lowCount = reflections.filter((r) => r.rating <= 2).length;
    const highCount = reflections.filter((r) => r.rating >= 4).length;
    const uniqueStudents = new Set(reflections.map((r) => r.studentName)).size;
    return {
      total,
      avgRating,
      lowCount,
      highCount,
      uniqueStudents,
    };
  }, [reflections]);

  // Lessons needing attention (grouped by lesson with low average rating)
  const lessonDifficultyRanking = useMemo(() => {
    const group = new Map<string, { courseId: string; unitNumber: number; lessonNumber: number; lessonTitle: string; unitTitle: string; ratings: number[] }>();
    reflections.forEach((r) => {
      const key = `${r.courseId}_u${r.unitNumber}_l${r.lessonNumber}`;
      if (!group.has(key)) {
        group.set(key, {
          courseId: r.courseId,
          unitNumber: r.unitNumber,
          lessonNumber: r.lessonNumber,
          lessonTitle: r.lessonTitle,
          unitTitle: r.unitTitle,
          ratings: [],
        });
      }
      group.get(key)!.ratings.push(r.rating);
    });

    const list = Array.from(group.values()).map((item) => {
      const avg = item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length;
      return {
        ...item,
        avgRating: Number(avg.toFixed(1)),
        count: item.ratings.length,
      };
    });

    // Sort by lowest average rating first
    return list.sort((a, b) => a.avgRating - b.avgRating).slice(0, 5);
  }, [reflections]);

  // Export report to CSV / Text
  const handleExport = () => {
    if (!filteredReflections.length) return;
    let content = 'تقرير التقييم الذاتي للطلاب (Self-Reflection)\n';
    content += `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}\n`;
    content += `عدد التقييمات: ${filteredReflections.length}\n\n`;
    content += 'اسم الطالب | الحقيبة | الباب | الدرس | التقييم | ملاحظة الطالب | التاريخ\n';
    content += '--------------------------------------------------------------------------------\n';

    filteredReflections.forEach((r) => {
      const c = getCourseById(r.courseId);
      const cName = c?.shortTitle || c?.title || r.courseId;
      const date = new Date(r.updatedAt).toLocaleDateString('ar-SA');
      content += `${r.studentName} | ${cName} | ${r.unitTitle} | ${r.lessonTitle} | ${r.rating}/5 (${r.ratingLabel}) | ${r.note || 'لا توجد ملاحظة'} | ${date}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-reflections-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-tajawal dir-rtl text-right">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
            <Star className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-quran text-amber-300">
                لوحة التقييم الذاتي لمدى فهم الطلاب (Self-Reflection)
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                مباشر
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تتبع مدى استيعاب الطلاب لكل درس من 1 إلى 5 نجوم مع ملاحظاتهم الصريحة، وتحديد الدروس التي تواجه صعوبة فوراً لتقديم الدعم والمراجعة المناسبة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث ({reflections.length})</span>
          </button>

          <button
            onClick={handleExport}
            disabled={!filteredReflections.length}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير التقرير</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي التقييمات الذاتية</div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">من {stats.uniqueStudents} طالباً مسجلاً</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">متوسط الاستيعاب العام</div>
          <div className="text-2xl font-black font-mono text-amber-500 mt-1 flex items-center gap-1">
            <span>{stats.avgRating}</span>
            <span className="text-xs text-slate-400">/ 5</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
            {Number(stats.avgRating) >= 4 ? 'مستوى فهم ممتاز ⚡' : 'مستوى فهم جيد 👍'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إتقان متقدم (4-5 ⭐)</div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.highCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.total ? Math.round((stats.highCount / stats.total) * 100) : 0}% من التقييمات
          </div>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-xs">
          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>بحاجة لدعم ومراجعة (1-2 ⭐)</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
            {stats.lowCount}
          </div>
          <div className="text-[10px] text-rose-700 dark:text-rose-300 mt-0.5 font-bold">
            {stats.lowCount > 0 ? 'يتطلب تدخل المعلم ⚠️' : 'لا توجد صعوبات معلنة ✓'}
          </div>
        </div>
      </div>

      {/* Alert Banner for Students Needing Attention (1 or 2 Stars) */}
      {stats.lowCount > 0 && (
        <div className="bg-gradient-to-l from-rose-950 via-rose-900 to-slate-900 border-2 border-rose-500/60 text-rose-100 p-4 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center gap-2 font-bold font-quran text-sm text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>تنبيه تربوي عاجل: طلاب بحاجة لمتابعة ودعم في الدروس التالية:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
            {reflections.filter((r) => r.rating <= 2).slice(0, 6).map((lowRef) => (
              <div key={lowRef.id} className="bg-slate-950/70 p-2.5 rounded-xl border border-rose-700/50 space-y-1">
                <div className="flex items-center justify-between gap-1 font-bold">
                  <span className="text-slate-100 truncate">{lowRef.studentName}</span>
                  <span className="bg-rose-500 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
                    {lowRef.rating}/5 ⭐
                  </span>
                </div>
                <div className="text-[11px] text-amber-300 truncate">
                  {lowRef.unitTitle} - {lowRef.lessonTitle}
                </div>
                {lowRef.note && (
                  <div className="text-[10px] text-slate-300 bg-rose-950/40 p-1 rounded italic truncate">
                    "{lowRef.note}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lessons with Lowest Average Rating */}
      {lessonDifficultyRanking.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold font-quran text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>أكثر الدروس التي سجل الطلاب فيها صعوبة (أقل تقييماً):</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">مرتبة تصاعدياً حسب متوسط الاستيعاب</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {lessonDifficultyRanking.map((item, idx) => (
              <div 
                key={`${item.courseId}_${item.unitNumber}_${item.lessonNumber}`}
                className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      item.avgRating <= 2.5
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : item.avgRating <= 3.5
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      متوسط {item.avgRating} / 5 ⭐
                    </span>
                  </div>
                </div>
                <div className="font-bold font-quran text-slate-800 dark:text-slate-100 truncate">
                  {item.lessonTitle}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {item.unitTitle} ({item.count} تقييمات مسجلة)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الطالب، اسم الدرس، أو ملاحظات الفهم..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-tajawal"
            />
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
          </div>

          {/* Course Filter */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-quran focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">-- كل الحقائب المقررة --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortTitle || c.title}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-quran focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">-- كل مستويات التقييم --</option>
            <option value="low">⚠️ بحاجة لدعم (1-2 ⭐ فقط)</option>
            <option value="high">🏆 إتقان عالٍ (4-5 ⭐ فقط)</option>
            <option value="1">⭐ 1 فقط (فهم ضعيف / يحتاج مراجعة)</option>
            <option value="2">⭐⭐ 2 فقط (فهم أساسي)</option>
            <option value="3">⭐⭐⭐ 3 فقط (فهم متوسط)</option>
            <option value="4">⭐⭐⭐⭐ 4 فقط (فهم جيد جداً)</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 فقط (إتقان تام)</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
          عرض {filteredReflections.length} من أصل {reflections.length} تقييم
        </div>
      </div>

      {/* Reflections Records Table / Cards */}
      {filteredReflections.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Star className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold font-quran text-slate-700 dark:text-slate-200">
            لا توجد تقييمات ذاتية مسجلة تطابق معايير البحث
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            عندما يكمل الطلاب قراءة الدروس ويقيمون استيعابهم من 1-5 نجوم في نهاية كل درس، ستظهر تقييماتهم وملاحظاتهم هنا مباشرة لتتمكن من متابعتها.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReflections.map((ref) => {
            const courseObj = getCourseById(ref.courseId);
            const courseName = courseObj?.shortTitle || courseObj?.title || ref.courseId;
            const ratingObj = REFLECTION_RATINGS.find((r) => r.value === ref.rating);
            const dateStr = new Date(ref.updatedAt).toLocaleDateString('ar-SA', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ref.id}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  ref.rating <= 2
                    ? 'bg-rose-950/20 border-rose-800/60 shadow-xs'
                    : ref.rating >= 4
                    ? 'bg-emerald-950/15 border-emerald-800/40 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                {/* Header line: Student, Course, Lesson, Star Rating Badge */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {ref.studentName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-quran">
                          {ref.studentName}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {courseName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {ref.unitTitle} · <span className="font-bold text-slate-700 dark:text-slate-300">{ref.lessonTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 border ${
                      ref.rating <= 2
                        ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                        : ref.rating >= 4
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500'
                    }`}>
                      <span className="text-amber-400">{'⭐'.repeat(ref.rating)}</span>
                      <span>({ref.rating} / 5)</span>
                      <span className="text-[10px] font-quran font-bold opacity-90 hidden sm:inline">
                        · {ratingObj?.label}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Rating Explanation Label */}
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[11px] text-slate-400">تقييم الطالب لمستوى استيعابه:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{ref.ratingLabel}</span>
                  </div>

                  {ref.rating <= 2 && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 shrink-0">
                      يحتاج جلسة إرشاد ومراجعة ⚠️
                    </span>
                  )}
                </div>

                {/* Student Personal Note / Reflection text */}
                {ref.note ? (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/40 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>ملاحظة الطالب حول الدرس وما يحتاج إلى تركيز:</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-tajawal leading-relaxed">
                      "{ref.note}"
                    </p>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">
                    لم يكتب الطالب ملاحظات نصية إضافية مع هذا التقييم.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
