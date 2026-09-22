import React, { useState } from 'react';
import { THEORY_CHAPTERS } from '../data/theoryData';
import { BookOpen, CheckCircle, Quote, ChevronLeft, Search, Sparkles, AlertCircle } from 'lucide-react';

export const TheoryView: React.FC = () => {
  const [activeChapterId, setActiveChapterId] = useState<string>(THEORY_CHAPTERS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChapters = THEORY_CHAPTERS.filter(ch => 
    (ch.title || '').includes(searchQuery) ||
    (ch.subtitle || '').includes(searchQuery) ||
    (ch.content || '').includes(searchQuery)
  );

  const currentChapter = THEORY_CHAPTERS.find(ch => ch.id === activeChapterId) || THEORY_CHAPTERS[0];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-quran text-slate-800">الشرح النظرى الأكاديمي الشامل</h2>
            <p className="text-xs text-slate-500">9 مباحث علمية مفصلة موثقة من أمهات كتب التجويد</p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في المباحث والعلل والمواضع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Chapter Selector */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2 sticky top-28">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 pb-2 border-b border-slate-100">
            فهرس المباحث الأكاديمية ({filteredChapters.length})
          </div>

          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {filteredChapters.map((chapter) => {
              const isSelected = chapter.id === activeChapterId;
              return (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapterId(chapter.id)}
                  className={`w-full text-right p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-2 border ${
                    isSelected
                      ? 'bg-emerald-900 text-white border-emerald-800 shadow-md font-bold'
                      : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 border-slate-200/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className={`text-xs sm:text-sm font-bold font-quran leading-snug ${isSelected ? 'text-amber-300' : 'text-slate-800'}`}>
                      {chapter.title}
                    </div>
                    <div className={`text-[11px] line-clamp-1 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {chapter.subtitle}
                    </div>
                  </div>
                  <ChevronLeft className={`w-4 h-4 shrink-0 mt-1 transition-transform ${isSelected ? 'rotate-180 text-amber-300' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Viewer */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Header of Active Chapter */}
          <div className="border-b border-slate-200 pb-5">
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-300">
              المبحث الأكاديمي
            </span>
            <h2 className="text-2xl font-bold font-quran text-slate-900 mt-2 leading-relaxed">
              {currentChapter.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {currentChapter.subtitle}
            </p>
          </div>

          {/* Key Takeaways Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>أبرز المحاور والنقاط الجوهرية بالمبحث:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-800">
              {currentChapter.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Formatted Content Body */}
          <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed font-tajawal space-y-4">
            {currentChapter.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-lg font-bold text-emerald-950 font-quran border-r-4 border-amber-500 pr-3 py-1 bg-amber-50/40 rounded-l-lg mt-6">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-base font-bold text-emerald-900 font-quran mt-4">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('```text')) {
                const codeContent = paragraph.replace('```text', '').replace('```', '').trim();
                return (
                  <div key={idx} className="bg-amber-950 text-amber-100 p-4 rounded-xl font-quran text-center text-lg leading-loose border border-amber-800 shadow-inner my-4">
                    <pre className="whitespace-pre-wrap font-quran">{codeContent}</pre>
                  </div>
                );
              }
              return (
                <p key={idx} className="text-slate-700 leading-loose">
                  {paragraph.replace(/\*\*(.*?)\*\*/g, (_, p1) => p1)}
                </p>
              );
            })}
          </div>

          {/* Scholarly Citations */}
          {currentChapter.citations && currentChapter.citations.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-amber-600" />
                <span>نصوص موثقة من أمهات الكتب والتآليف:</span>
              </div>
              {currentChapter.citations.map((cite, idx) => (
                <div key={idx} className="bg-slate-50 border-r-4 border-emerald-600 p-4 rounded-l-xl text-xs sm:text-sm text-slate-700 space-y-1">
                  <div className="font-bold text-emerald-900 font-quran">{cite.book}:</div>
                  <p className="italic font-quran leading-relaxed text-slate-800">"{cite.text}"</p>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            {THEORY_CHAPTERS.findIndex(c => c.id === currentChapter.id) > 0 ? (
              <button
                onClick={() => {
                  const prevIndex = THEORY_CHAPTERS.findIndex(c => c.id === currentChapter.id) - 1;
                  setActiveChapterId(THEORY_CHAPTERS[prevIndex].id);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                المبحث السابق
              </button>
            ) : <div />}

            {THEORY_CHAPTERS.findIndex(c => c.id === currentChapter.id) < THEORY_CHAPTERS.length - 1 ? (
              <button
                onClick={() => {
                  const nextIndex = THEORY_CHAPTERS.findIndex(c => c.id === currentChapter.id) + 1;
                  setActiveChapterId(THEORY_CHAPTERS[nextIndex].id);
                }}
                className="text-xs bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                المبحث التالي ⟵
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
};
