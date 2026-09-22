import React, { useState } from 'react';
import { QURAN_EXAMPLES } from '../data/examplesData';
import { PronunciationSimulator } from './PronunciationSimulator';
import { Search, Filter, Sparkles, BookOpen, AlertCircle, ArrowRightLeft, Volume2 } from 'lucide-react';
import { DisposalMethod, Course } from '../types';

interface ExamplesViewProps {
  course?: Course;
}

export const ExamplesView: React.FC<ExamplesViewProps> = ({ course }) => {
  const examples = (course && course.quranExamples && course.quranExamples.length > 0)
    ? course.quranExamples
    : QURAN_EXAMPLES;

  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(examples[0]?.id || null);

  const filterMethods = course?.id === 'idgham'
    ? [
        { id: 'ALL', label: `جميع أمثلة الإدغام (${examples.length})` },
        { id: 'متجانسين', label: 'إدغام المتجانسين' },
        { id: 'متقاربين', label: 'إدغام المتقاربين' },
        { id: 'كامل', label: 'إدغام كامل' },
        { id: 'ناقص', label: 'إدغام ناقص' },
        { id: 'استثناء', label: 'استثناء وسكت' },
      ]
    : [
        { id: 'ALL', label: `جميع الأمثلة (${examples.length}+)` },
        { id: 'تحريك بالكسر', label: 'التحريك بالكسر' },
        { id: 'تحريك بالفتح', label: 'التحريك بالفتح' },
        { id: 'تحريك بالضم', label: 'التحريك بالضم' },
        { id: 'حذف حرف المد لفظاً', label: 'حذف حرف المد' },
      ];

  const filteredExamples = examples.filter((ex) => {
    const matchesMethod =
      selectedMethod === 'ALL' ||
      (ex.method || '').includes(selectedMethod) ||
      (ex.reason || '').includes(selectedMethod);
    const matchesSearch =
      (ex.targetPhrase || '').includes(searchQuery) ||
      (ex.surahName || '').includes(searchQuery) ||
      (ex.ayahText || '').includes(searchQuery) ||
      (ex.reason || '').includes(searchQuery);
    return matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                التطبيق العملي
              </span>
              <h2 className="text-xl font-bold font-quran text-slate-800">
                أمثلة قرآنية محللة بالكامل ({filteredExamples.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              تحليل شامل للساكن الأول والثاني، سبب الالتقاء، طريق التخلص، ونموذج النطق الصحيح والتنبيه على الأخطاء
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بكلمة أو سورة أو أثر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-bold shrink-0">تصنيف حسب طريقة التخلص:</span>
          {filterMethods.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedMethod === m.id
                  ? 'bg-emerald-900 text-amber-300 shadow-sm font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Examples Grid / List */}
      <div className="space-y-4">
        {filteredExamples.map((ex, index) => {
          const isExpanded = expandedId === ex.id;
          return (
            <div
              key={ex.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                isExpanded ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md' : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              {/* Card Header Bar */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold font-quran text-slate-900 bg-amber-50 px-3 py-0.5 rounded-lg border border-amber-200 text-amber-900">
                        {ex.targetPhrase}
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        سورة {ex.surahName} - الآية {ex.ayahNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      ex.method.includes('كسر')
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : ex.method.includes('فتح')
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : ex.method.includes('ضم')
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {ex.method}
                  </span>
                  <button className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
                    {isExpanded ? 'طي التحليل' : 'عرض التحليل المكتمل ⟵'}
                  </button>
                </div>
              </div>

              {/* Full Expanded Analysis Drawer */}
              {isExpanded && (
                <div className="p-5 sm:p-7 border-t border-slate-200 space-y-6 bg-white">
                  {/* Full Ayah View */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 text-center space-y-2">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-3 py-0.5 rounded-full">
                      الآية الكريمة كاملة بالتشكيل المصحفي
                    </span>
                    <p className="font-quran text-xl sm:text-2xl text-slate-900 leading-loose">
                      ﴿ {ex.ayahText} ﴾
                    </p>
                  </div>

                  {/* Structural Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* First Sukoon */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                      <div className="text-xs font-bold text-slate-400">الحرف الساكن الأول:</div>
                      <div className="text-sm font-bold font-quran text-slate-800">{ex.firstSukoon}</div>
                    </div>

                    {/* Second Sukoon */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                      <div className="text-xs font-bold text-slate-400">الحرف الساكن الثاني:</div>
                      <div className="text-sm font-bold font-quran text-slate-800">{ex.secondSukoon}</div>
                    </div>

                    {/* Method */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                      <div className="text-xs font-bold text-emerald-700">طريقة التخلص بالتفصيل:</div>
                      <div className="text-sm font-bold text-emerald-950">{ex.disposalDetails}</div>
                    </div>
                  </div>

                  {/* Reason for Occurrence */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                      <span>سبب حدوث التقاء الساكنين:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-tajawal">
                      {ex.reason}
                    </p>
                  </div>

                  {/* Audio Pronunciation Simulator Component */}
                  <PronunciationSimulator
                    phrase={ex.targetPhrase}
                    correctText={ex.audioPronunciationText}
                    incorrectText={ex.incorrectPronunciationText}
                    guide={ex.pronunciationGuide}
                    mistake={ex.commonMistake}
                  />

                  {/* Scholarly Note */}
                  {ex.scholarlyNote && (
                    <div className="bg-amber-50/50 border-r-4 border-amber-500 p-4 rounded-l-xl text-xs sm:text-sm space-y-1">
                      <span className="font-bold text-amber-900 font-quran">توجيه علماء التجويد:</span>
                      <p className="text-slate-700 leading-relaxed font-tajawal">{ex.scholarlyNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
