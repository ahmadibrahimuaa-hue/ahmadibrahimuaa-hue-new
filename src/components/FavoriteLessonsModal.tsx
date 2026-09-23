import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, BookOpen, Video, Trash2, ArrowLeft, Search, X, 
  ExternalLink, Sparkles, Filter, AlertCircle, Layers, CheckCircle2, Bookmark
} from 'lucide-react';
import { 
  FavoriteLessonItem, 
  getFavoriteLessons, 
  removeFavoriteLesson, 
  clearAllFavorites, 
  subscribeFavoriteLessons 
} from '../utils/favoriteLessonsStorage';

interface FavoriteLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (courseId: string, unitNumber: number, lessonNumber: number) => void;
}

export const FavoriteLessonsModal: React.FC<FavoriteLessonsModalProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
}) => {
  const [favorites, setFavorites] = useState<FavoriteLessonItem[]>(() => getFavoriteLessons());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const unsub = subscribeFavoriteLessons((updated) => {
      setFavorites(updated);
    });
    return () => unsub();
  }, []);

  // Unique courses in favorites
  const availableCourses = useMemo(() => {
    const map = new Map<string, string>();
    favorites.forEach((fav) => {
      if (!map.has(fav.courseId)) {
        map.set(fav.courseId, fav.courseTitle || fav.courseId);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [favorites]);

  // Filtered favorites
  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      // Course filter
      if (selectedCourseFilter !== 'all' && fav.courseId !== selectedCourseFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = fav.lessonTitle.toLowerCase().includes(q);
        const matchesSubtitle = (fav.lessonSubtitle || '').toLowerCase().includes(q);
        const matchesUnit = fav.unitTitle.toLowerCase().includes(q);
        const matchesCourse = fav.courseTitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle && !matchesUnit && !matchesCourse) {
          return false;
        }
      }
      return true;
    });
  }, [favorites, selectedCourseFilter, searchQuery]);

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeFavoriteLesson(id);
  };

  const handleClearAll = async () => {
    await clearAllFavorites();
    setShowClearConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-tajawal dir-rtl">
      <div 
        className="bg-slate-900 border-2 border-rose-500/40 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600"></div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black font-quran text-amber-200">
                  دروسي المفضلة
                </h3>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                  {favorites.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                قائمة الدروس والشروح التي قمت بتمييزها للرجوع والمراجعة السريعة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1 font-quran"
                title="إفراغ قائمة المفضلة"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">إفراغ القائمة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        {favorites.length > 0 && (
          <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الدروس المفضلة..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Course Filter Tabs / Select */}
            {availableCourses.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedCourseFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer whitespace-nowrap ${
                    selectedCourseFilter === 'all'
                      ? 'bg-rose-600 text-white font-black shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  كافة الحقائب ({favorites.length})
                </button>
                {availableCourses.map((c) => {
                  const count = favorites.filter((f) => f.courseId === c.id).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCourseFilter(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        selectedCourseFilter === c.id
                          ? 'bg-rose-600 text-white font-black shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{c.title}</span>
                      <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Clear All Confirmation Alert */}
        {showClearConfirm && (
          <div className="m-4 p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-200 text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>هل أنت متأكد من رغبتك في إفراغ كافة الدروس من قائمة المفضلة؟</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleClearAll}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                نعم، إفراغ الكل
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Lessons List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
          {favorites.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-dashed border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Heart className="w-10 h-10 opacity-60" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-lg font-bold font-quran text-slate-200">
                  قائمة المفضلة فارغة حالياً
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  يمكنك حفظ أي درس للرجوع إليه لاحقاً بمجرد النقر على أيقونة القلب 
                  <span className="inline-flex items-center mx-1 text-rose-400 font-bold">❤️</span>
                  الموجودة في شريط عنوان الدرس داخل أي حقيبة تعليمية.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold font-quran px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>تصفح الدروس والمناهج الآن</span>
                </button>
              </div>
            </div>
          ) : filteredFavorites.length === 0 ? (
            /* No Filter Matches State */
            <div className="text-center py-10 space-y-3">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400 font-quran">
                لم يتم العثور على دروس تطابق بحثك: "{searchQuery}"
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCourseFilter('all'); }}
                className="text-xs text-rose-400 hover:underline font-bold"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            /* Cards List */
            filteredFavorites.map((item) => {
              const formattedDate = new Date(item.addedAt).toLocaleDateString('ar-EG', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectLesson(item.courseId, item.unitNumber, item.lessonNumber);
                    onClose();
                  }}
                  className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-sm hover:shadow-xl group relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left accent bar on hover */}
                  <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="space-y-2 flex-1 pr-1">
                    {/* Course & Unit Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 px-2.5 py-0.5 rounded-full font-bold font-quran flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-emerald-400" />
                        <span>{item.courseTitle}</span>
                      </span>

                      <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-quran">
                        الوحدة {item.unitNumber}: {item.unitTitle}
                      </span>

                      {item.hasVideo && (
                        <span className="bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold font-tajawal flex items-center gap-1">
                          <Video className="w-3 h-3 text-red-400" />
                          <span>فيديو شرحي</span>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-500 mr-auto">
                        حفظت في {formattedDate}
                      </span>
                    </div>

                    {/* Lesson Title & Subtitle */}
                    <div>
                      <h4 className="text-base sm:text-lg font-bold font-quran text-slate-100 group-hover:text-amber-200 transition-colors flex items-center gap-2">
                        <span className="text-rose-400">♥</span>
                        <span>الدرس 0{item.lessonNumber}: {item.lessonTitle}</span>
                      </h4>
                      {item.lessonSubtitle && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {item.lessonSubtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Open & Unfavorite */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={(e) => handleRemove(e, item.id)}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-rose-400 border border-slate-700 hover:border-rose-500 transition-all cursor-pointer"
                      title="إزالة من المفضلة"
                    >
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectLesson(item.courseId, item.unitNumber, item.lessonNumber);
                        onClose();
                      }}
                      className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-1.5 shadow-md group-hover:scale-105 cursor-pointer"
                    >
                      <span>الانتقال للدرس</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>يمكنك الوصول لمفضلتك في أي وقت من شريط الطالب العلوي</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {filteredFavorites.length} من {favorites.length}
          </span>
        </div>
      </div>
    </div>
  );
};
