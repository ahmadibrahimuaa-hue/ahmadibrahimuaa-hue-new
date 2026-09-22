import React, { useState, useEffect } from 'react';
import { X, Check, Type, Eye, Sparkles, BookOpen, CheckCircle2, Sliders, RefreshCw } from 'lucide-react';
import { QURAN_FONT_OPTIONS, QuranFontOption, getSelectedQuranFontId, setQuranFont } from '../utils/quranFontManager';

interface QuranFontModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuranFontModal: React.FC<QuranFontModalProps> = ({ isOpen, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>(getSelectedQuranFontId());
  const [previewVerseIndex, setPreviewVerseIndex] = useState<number>(0);
  const [fontSizeClass, setFontSizeClass] = useState<'text-lg' | 'text-2xl' | 'text-3xl' | 'text-4xl'>('text-2xl');

  const sampleVerses = [
    {
      text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ۝ خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ ۝ اقْرَأْ وَرَبُّكَ الْأَكْرَمُ',
      source: 'سورة العلق: ١-٣',
      focus: 'أمثلة التقاء الساكنين والوقف القرآني',
    },
    {
      text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
      source: 'سورة الطلاق: ٢-٣',
      focus: 'أمثلة الإدغام والمتقاربين والمتجانسين',
    },
    {
      text: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
      source: 'سورة الإخلاص',
      focus: 'التنوين عند التقاء الساكنين وصلا (أَحَدٌ اللَّهُ)',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedId(getSelectedQuranFontId());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeFont = QURAN_FONT_OPTIONS.find((f) => f.id === selectedId) || QURAN_FONT_OPTIONS[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setQuranFont(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn dir-rtl font-tajawal">
      <div className="bg-slate-900 border-2 border-amber-500/40 text-slate-100 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-quran text-amber-200 flex items-center gap-2">
                <span>تخصيص خطوط المصحف والتلاوة</span>
                <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full font-tajawal">
                  تجربة القراءة
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                اختر خط الرسم القرآني الأنسب لعينيك ولدراسة شواهد التجويد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Live Preview Box */}
          <div className="bg-slate-950/90 rounded-2xl p-5 border border-amber-500/30 shadow-inner space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>معاينة حية فورية للرسم القرآني بالخط المحدد:</span>
              </div>
              
              {/* Font Size Selector */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 ml-1">حجم الخط:</span>
                <button
                  onClick={() => setFontSizeClass('text-lg')}
                  className={`px-2 py-0.5 rounded text-xs transition-all ${fontSizeClass === 'text-lg' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  عادي
                </button>
                <button
                  onClick={() => setFontSizeClass('text-2xl')}
                  className={`px-2 py-0.5 rounded text-xs transition-all ${fontSizeClass === 'text-2xl' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  كبير
                </button>
                <button
                  onClick={() => setFontSizeClass('text-3xl')}
                  className={`px-2 py-0.5 rounded text-xs transition-all ${fontSizeClass === 'text-3xl' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  مكبر جداً
                </button>
              </div>
            </div>

            {/* Verse Card */}
            <div 
              style={{ fontFamily: activeFont.fontFamily }}
              className={`p-6 bg-gradient-to-b from-slate-900 to-emerald-950/30 rounded-xl text-amber-100 text-center leading-loose transition-all duration-300 border border-emerald-800/40 shadow-md ${fontSizeClass}`}
            >
              {sampleVerses[previewVerseIndex].text}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="text-amber-400/90 font-medium">
                📖 {sampleVerses[previewVerseIndex].source} ({sampleVerses[previewVerseIndex].focus})
              </span>
              <button
                onClick={() => setPreviewVerseIndex((prev) => (prev + 1) % sampleVerses.length)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تبديل الآية النموذجية</span>
              </button>
            </div>
          </div>

          {/* Font List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>قائمة الخطوط القرآنية المتاحة:</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {QURAN_FONT_OPTIONS.map((font) => {
                const isSelected = selectedId === font.id;
                return (
                  <div
                    key={font.id}
                    onClick={() => handleSelect(font.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-base font-bold font-quran ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                          {font.name}
                        </span>
                        {font.category === 'uthmanic' && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            رسم عثماني أصيل
                          </span>
                        )}
                        {font.category === 'naskh' && (
                          <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold">
                            نسخ عالي الوضوح
                          </span>
                        )}
                        {font.category === 'modern' && (
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-bold">
                            حديث ومتوازن
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {font.description}
                      </p>
                      
                      <p className="text-[11px] text-amber-400/80">
                        💡 الأنسب لـ: {font.recommendedFor}
                      </p>
                    </div>

                    <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>الخط المعتمد حالياً</span>
                          </>
                        ) : (
                          <span>اختيار هذا الخط</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            يتم حفظ اختيارك تلقائياً وتطبيقه على كافة الشواهد والآيات القرآنية.
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
