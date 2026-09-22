import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, BookOpen, GraduationCap, Table, Bookmark, 
  Sparkles, ArrowLeft, Check, Copy, Layers, BookMarked, Filter 
} from 'lucide-react';
import { 
  searchSakinanCourse, 
  SakinanSearchResult, 
  SearchResultCategory, 
  POPULAR_SAKINAN_SEARCH_TERMS 
} from '../utils/sakinanSearchEngine';

interface SakinanSearchBarProps {
  onNavigateTo?: (tab: string, unitIndex?: number, lessonId?: string, exampleId?: string) => void;
  onSelectResult?: (result: SakinanSearchResult) => void;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'embedded' | 'modal';
}

export const SakinanSearchBar: React.FC<SakinanSearchBarProps> = ({
  onNavigateTo,
  onSelectResult,
  isOpen = true,
  onClose,
  mode = 'modal',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchResultCategory>('all');
  const [results, setResults] = useState<SakinanSearchResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      const found = searchSakinanCourse(searchQuery, activeCategory, 35);
      setResults(found);
    } else {
      setResults([]);
    }
  }, [searchQuery, activeCategory]);

  // Focus input when modal opens
  useEffect(() => {
    if (mode === 'modal' && isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode, isOpen]);

  // Keyboard shortcut Ctrl+K or / to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      } else if (e.key === 'Escape') {
        setIsFocused(false);
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleCopySnippet = (item: SakinanSearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const copyContent = `${item.title}\n${item.subtitle}\n${item.matchedSnippet}`;
    navigator.clipboard.writeText(copyContent);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSelectResult = (item: SakinanSearchResult) => {
    if (onSelectResult) {
      onSelectResult(item);
    }
    if (onNavigateTo) {
      onNavigateTo(item.targetTab, item.unitIndex, item.lessonId, item.exampleId);
    }
    if (onClose) onClose();
    setIsFocused(false);
  };

  const categories: { id: SearchResultCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'كافة المحتويات', icon: Sparkles },
    { id: 'shawahid_examples', label: 'الشواهد والأمثلة', icon: GraduationCap },
    { id: 'lessons', label: 'الدروس والأبواب', icon: BookOpen },
    { id: 'exceptions', label: 'الكلمات المستثناة', icon: BookMarked },
    { id: 'summary_rules', label: 'قواعد المقارنة', icon: Table },
  ];

  const content = (
    <div className="w-full font-tajawal dir-rtl space-y-3">
      {/* Search Input Box */}
      <div className="relative group">
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-amber-500">
          <Search className="w-5 h-5" />
        </div>

        <input
          ref={inputRef}
          id="sakinan-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="ابحث بسرعة في شواهد، دروس، كلمات، أو أمثلة حقيبة التقاء الساكنين (مثال: قل ادعوا، يهدي، كسر، عاصم)..."
          className="w-full pr-11 pl-20 py-3 text-sm sm:text-base rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-700/40 dark:border-slate-700 focus:border-amber-400 dark:focus:border-amber-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-sm focus:shadow-md focus:outline-none transition-all font-tajawal"
        />

        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center gap-1.5">
          {searchQuery && (
            <button
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {mode === 'modal' && onClose && (
            <button
              onClick={onClose}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              Esc
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-quran">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold flex items-center gap-1 shrink-0 ml-1">
          <Filter className="w-3 h-3 text-amber-500" />
          <span>تصفية:</span>
        </span>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer font-bold ${
                isSelected
                  ? 'bg-emerald-900 dark:bg-emerald-800 text-amber-300 shadow-xs ring-1 ring-amber-400/50'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Popular Search Suggestions (shown when query is empty) */}
      {searchQuery.trim().length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold font-quran">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>شواهد ومصطلحات شائعة في حقيبة التقاء الساكنين:</span>
            </span>
            <span className="text-[10px] text-slate-400">انقر للبحث الفوري</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SAKINAN_SEARCH_TERMS.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  inputRef.current?.focus();
                }}
                className="bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-xl text-xs font-quran transition-all cursor-pointer shadow-xs hover:text-amber-800 dark:hover:text-amber-300"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results List */}
      {searchQuery.trim().length > 0 && (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-quran px-1 text-slate-500 dark:text-slate-400">
            <span>
              نتائج البحث لـ <strong className="text-amber-600 dark:text-amber-400">"{searchQuery}"</strong>:
            </span>
            <span className="font-sans font-bold">
              {results.length} {results.length === 1 ? 'نتيجة' : 'نتائج'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold font-quran text-slate-700 dark:text-slate-300">
                لم يتم العثور على نتائج مطابقة لـ "{searchQuery}"
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                جرب البحث بكلمة أخرى، مثل: "ادعوا"، "الكسر"، "المد"، "عاصم"، أو اختر أحد المصطلحات الشائعة أعلاه.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  className="bg-white dark:bg-slate-900 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-600/60 dark:hover:border-emerald-600/60 rounded-2xl p-3.5 transition-all cursor-pointer shadow-xs hover:shadow-md group relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-quran border ${item.categoryColor}`}>
                          {item.categoryLabel}
                        </span>

                        {item.badgeText && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-quran">
                            {item.badgeText}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {item.subtitle}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold font-quran text-slate-900 dark:text-amber-200 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-tajawal bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        {item.matchedSnippet}
                      </p>
                    </div>

                    {/* Actions on result item */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0 pt-1">
                      <button
                        onClick={(e) => handleCopySnippet(item, e)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-amber-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="نسخ نص الشاهد والمثال"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSelectResult(item)}
                        className="bg-emerald-900 hover:bg-emerald-950 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold font-quran flex items-center gap-1 transition-all shadow-xs cursor-pointer group-hover:scale-105"
                      >
                        <span>انتقال</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (mode === 'modal') {
    if (!isOpen) return null;
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-3xl w-full p-4 sm:p-6 border-2 border-amber-400 shadow-2xl space-y-4 text-right relative mt-6 sm:mt-10 mb-8">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black font-quran text-slate-900 dark:text-slate-100">
                  البحث السريع في حقيبة «التقاء الساكنين»
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ابحث عن الكلمات، الشواهد القرآنية، الدروس، والاستثناءات
                </p>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title="إغلاق نافذة البحث"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl p-3 sm:p-4 border border-emerald-700/30 dark:border-slate-800 shadow-xs">
      {content}
    </div>
  );
};
