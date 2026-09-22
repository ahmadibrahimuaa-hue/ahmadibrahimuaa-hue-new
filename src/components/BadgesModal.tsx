import React, { useState } from 'react';
import { Award, X, Sparkles, CheckCircle2, Lock, Trophy, Star, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { StudentBadge, getCourseBadges } from '../utils/badgeSystem';
import { getStudentProgress } from '../utils/studentProgressStorage';
import { ALL_COURSES, getCourseById } from '../data/courses';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourseId?: string;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  activeCourseId = 'sakinan',
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourseId);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'unit' | 'exam' | 'special'>('all');

  if (!isOpen) return null;

  const currentCourse = getCourseById(selectedCourseId) || ALL_COURSES[0];
  const progress = getStudentProgress(selectedCourseId);
  const badges = getCourseBadges(progress, selectedCourseId);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const totalCount = badges.length;
  const unlockPercentage = Math.round((unlockedCount / Math.max(1, totalCount)) * 100);

  const filteredBadges = badges.filter((b) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'unit') return b.category === 'unit';
    if (categoryFilter === 'exam') return b.category === 'exam';
    if (categoryFilter === 'special') return b.category === 'special' || b.category === 'course';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-tajawal dir-rtl no-print">
      <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl max-w-4xl w-full text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 border-b border-emerald-800/80 relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-emerald-900/60 rounded-full transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl text-slate-950 shadow-lg border border-amber-300">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-quran text-amber-200 flex items-center gap-2">
                  <span>سجل الأوسمة والإنجازات القرآنية</span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  أوسمة التميز الممنوحة عند إتمام الأبواب الدراسية وتحقيق الدرجات الكاملة
                </p>
              </div>
            </div>

            {/* Overall Unlocked Badge Counter */}
            <div className="bg-slate-950/80 border border-emerald-600/50 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-emerald-300 font-bold font-quran">
                  الأوسمة المحققة:
                </div>
                <div className="text-lg font-black font-quran text-amber-400">
                  {unlockedCount} / {totalCount} <span className="text-xs text-slate-400">({unlockPercentage}%)</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
                ⭐
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Course Selector Tabs & Category Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Courses Tab */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {ALL_COURSES.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCourseId === course.id
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{course.shortTitle || course.title}</span>
                </button>
              ))}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'all' ? 'bg-emerald-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({badges.length})
              </button>
              <button
                onClick={() => setCategoryFilter('unit')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'unit' ? 'bg-emerald-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                أبواب الدورة ({badges.filter((b) => b.category === 'unit').length})
              </button>
              <button
                onClick={() => setCategoryFilter('exam')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'exam' ? 'bg-emerald-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الاختبارات ({badges.filter((b) => b.category === 'exam').length})
              </button>
              <button
                onClick={() => setCategoryFilter('special')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'special' ? 'bg-emerald-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                أوسمة كبرى ({badges.filter((b) => b.category === 'special' || b.category === 'course').length})
              </button>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                  badge.isUnlocked
                    ? `${badge.color.bg} ${badge.color.border} ${badge.color.glow} text-slate-100`
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Top status indicator */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold font-quran px-2 py-0.5 rounded-full border border-slate-700/60 bg-slate-950/60 text-slate-300">
                    {badge.subtitle}
                  </span>

                  {badge.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 font-quran">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>مكتسب ✓</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-700 font-quran">
                      <Lock className="w-3 h-3" />
                      <span>مغلق</span>
                    </span>
                  )}
                </div>

                {/* Badge Icon & Title */}
                <div className="text-center space-y-2.5 my-2">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl font-bold shadow-md border ${
                      badge.isUnlocked
                        ? 'bg-slate-950/60 border-amber-400/60 shadow-amber-500/10'
                        : 'bg-slate-950/30 border-slate-800 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <h3 className="text-sm font-black font-quran text-slate-100 leading-snug">
                    {badge.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
                    {badge.description}
                  </p>
                </div>

                {/* Requirement Footnote */}
                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-quran flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>شرط الاستحقاق: {badge.requirement}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-quran">
          <span>يتم تحديث الأوسمة تلقائياً بمجرد إتمام الأبواب أو رصد نتائج الاختبارات.</span>
          <button
            onClick={onClose}
            className="bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
