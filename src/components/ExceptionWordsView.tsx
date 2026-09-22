import React, { useState } from 'react';
import { EXCEPTION_WORDS_DATA } from '../data/exceptionWordsData';
import { Course } from '../types';
import { Sparkles, Bookmark, BookOpen, Volume2, CheckCircle2, Search, Filter } from 'lucide-react';

interface ExceptionWordsViewProps {
  course?: Course;
}

export const ExceptionWordsView: React.FC<ExceptionWordsViewProps> = ({ course }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hafs' | 'general'>('all');

  const words = (course && course.exceptionWords && course.exceptionWords.length > 0) 
    ? course.exceptionWords 
    : EXCEPTION_WORDS_DATA;

  const topicName = course?.shortTitle || course?.title || 'التقاء الساكنين';

  const filteredWords = words.filter(item => {
    const matchesSearch = (item.word || '').includes(searchTerm) || (item.surah || '').includes(searchTerm) || (item.originText || '').includes(searchTerm);
    if (filterType === 'hafs') return matchesSearch && item.isHafsSpecific;
    if (filterType === 'general') return matchesSearch && !item.isHafsSpecific;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-amber-700/50 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>المواضع الخاصة والكلمات المستثناة</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-quran text-amber-100">
          معجم الكلمات المستثناة في {topicName} (برواية حفص وبقية القراء)
        </h1>
        <p className="text-xs sm:text-sm text-amber-200/90 font-tajawal max-w-3xl leading-relaxed">
          دليل تحليلي شامل لكل كلمة قرآنية وموضع خاص خرج عن الأصل القياسي في {topicName}، مع بيان أصل الكلمة، سبب الحكم، الأوجه الجائزة، وتوجيه أئمة القراءات والنشر.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الكلمة أو السورة..."
            className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterType === 'all' ? 'bg-emerald-900 text-amber-300 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            جميع الكلمات ({words.length})
          </button>
          <button
            onClick={() => setFilterType('hafs')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterType === 'hafs' ? 'bg-amber-800 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            خاصة بحفص عن عاصم
          </button>
          <button
            onClick={() => setFilterType('general')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterType === 'general' ? 'bg-purple-900 text-purple-100 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            عند جميع القراء
          </button>
        </div>
      </div>

      {/* Words Cards */}
      <div className="space-y-6">
        {filteredWords.map((item, idx) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-amber-300 transition-all space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-bold text-sm flex items-center justify-center shrink-0">
                  0{idx + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-quran text-slate-900">{item.word}</h3>
                  <p className="text-xs text-emerald-800 font-bold mt-0.5">
                    سورة {item.surah} (الآية: {item.ayah})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                  item.isHafsSpecific ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-purple-100 text-purple-900 border border-purple-300'
                }`}>
                  {item.isHafsSpecific ? 'خاصة بحفص' : 'عند جميع القراء'}
                </span>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-tajawal">
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 space-y-1">
                <span className="font-bold text-amber-950 font-quran text-sm">أصل الكلمة الصرفي واللغوي:</span>
                <p className="text-slate-700 leading-relaxed">{item.originText}</p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/60 space-y-1">
                <span className="font-bold text-emerald-950 font-quran text-sm">طريقة التخلص المتبعة:</span>
                <p className="text-emerald-900 font-bold">{item.disposalMethod}</p>
                <p className="text-slate-600 leading-relaxed mt-1">{item.sukoonCause}</p>
              </div>
            </div>

            {/* Reading Options Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>تفصيل أوجه القراءة عند حفص وبقية القراء:</span>
              </div>
              <ul className="space-y-1.5 pr-4 text-xs text-slate-700 list-disc">
                {item.readingOptions.map((opt, i) => (
                  <li key={i} className="leading-relaxed">{opt}</li>
                ))}
              </ul>
            </div>

            {/* Scholarly Direction */}
            <div className="bg-emerald-950 text-emerald-200 p-4 rounded-xl border border-emerald-800 text-xs space-y-1">
              <span className="font-bold text-amber-300 font-quran text-sm">توجيه علماء القراءات والنشر:</span>
              <p className="leading-relaxed">{item.scholarlyDirection}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
