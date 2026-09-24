import React, { useState } from 'react';
import { 
  X, Check, Save, RotateCcw, Sparkles, BookOpen, AlertCircle, 
  Layers, Eye, EyeOff, Layout, Megaphone, Star, ShieldCheck, ChevronRight
} from 'lucide-react';
import { HomeConfig, HomeCurriculumItemConfig, HomeAnnouncementType, HomeDefaultView } from '../utils/homeConfigStorage';
import { Course, CourseLevel } from '../types';

interface HomeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HomeConfig;
  courses: Course[];
  onSave: (updated: Partial<HomeConfig>) => Promise<void>;
  onReset: () => Promise<void>;
  currentAuthorName?: string;
}

export const HomeCustomizerModal: React.FC<HomeCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  courses,
  onSave,
  onReset,
  currentAuthorName,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'announcement' | 'curricula' | 'display'>('general');
  const [formData, setFormData] = useState<HomeConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Sync state if modal opens with fresh config
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...config });
      setSaveSuccessMessage(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleCurriculumChange = (courseId: string, partial: Partial<HomeCurriculumItemConfig>) => {
    setFormData((prev) => {
      const existing = prev.curriculumConfigs[courseId] || { courseId };
      return {
        ...prev,
        curriculumConfigs: {
          ...prev.curriculumConfigs,
          [courseId]: {
            ...existing,
            ...partial,
          },
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setSaveSuccessMessage(true);
      setTimeout(() => {
        setSaveSuccessMessage(false);
      }, 2500);
    } catch (e) {
      console.error('Error saving home config:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('هل أنت متأكد من استعادة النصوص والإعدادات الافتراضية لواجهة المناهج والهوم؟')) {
      setIsSaving(true);
      try {
        await onReset();
        onClose();
      } catch (e) {
        console.error('Reset error:', e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn font-tajawal dir-rtl">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-quran text-slate-100">
                تخصيص واجهة الهوم والمناهج المقررة
              </h2>
              <p className="text-xs text-slate-400">
                التحكم الكامل في النصوص التوجيهية، الإعلانات، وتصنيف الحقائب حسب المستويات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900 text-xs">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`px-3.5 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeSubTab === 'general'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>عناوين وترويسة المنصة</span>
          </button>

          <button
            onClick={() => setActiveSubTab('announcement')}
            className={`px-3.5 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeSubTab === 'announcement'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>شريط الإعلانات والتنبيهات</span>
            {formData.showAnnouncement && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('curricula')}
            className={`px-3.5 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeSubTab === 'curricula'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>تصنيف الحقائب والمستويات ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('display')}
            className={`px-3.5 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeSubTab === 'display'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>خيارات العرض الافتراضي</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* TAB 1: GENERAL HEADERS */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
                💡 <strong className="text-slate-200">ملاحظة للمعلم:</strong> التعديلات هنا تظهر فوراً في ترويسة الصفحة الرئيسية لكل الطلاب والزائرين.
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-200">
                  العنوان الرئيسي للمناهج في الصفحة:
                </label>
                <input
                  type="text"
                  value={formData.mainTitle}
                  onChange={(e) => setFormData({ ...formData, mainTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-slate-100 font-quran font-bold text-sm sm:text-base outline-none transition-colors"
                  placeholder="المناهج التعليمية المقررة لمادة التجويد والقراءات"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">
                    الشعار العلوي / شارة المنصة:
                  </label>
                  <input
                    type="text"
                    value={formData.platformBadgeText}
                    onChange={(e) => setFormData({ ...formData, platformBadgeText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-slate-200 outline-none transition-colors"
                    placeholder="المنصة التفاعلية الموحدة"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">
                    سطر الإعداد والإشراف الأكاديمي:
                  </label>
                  <input
                    type="text"
                    value={formData.authorText}
                    onChange={(e) => setFormData({ ...formData, authorText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-slate-200 outline-none transition-colors"
                    placeholder="جمع وإعداد: أحمد إبراهيم"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">
                  العنوان الفرعي للمنظومة:
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-slate-200 outline-none transition-colors"
                  placeholder="منظومة تدريبية متدرجة من التأسيس إلى الإتقان والإجازة"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">
                  النص التعريفي والتوجيهي للمناهج والمسار الدراسي:
                </label>
                <textarea
                  rows={3}
                  value={formData.introParagraph}
                  onChange={(e) => setFormData({ ...formData, introParagraph: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl p-3 text-slate-200 outline-none transition-colors leading-relaxed"
                  placeholder="منظومة منهجية متدرجة تبدأ بـ «حقيبة التقاء الساكنين»، وعقب اجتياز اختبارها الشامل..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENT BANNER */}
          {activeSubTab === 'announcement' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200">تفعيل شريط التنبيهات والإعلانات للدارسين</h4>
                  <p className="text-xs text-slate-400">
                    عند تفعيله، يظهر شريط تنبيه مميز في أعلى واجهة الهوم لكافة الطلاب.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showAnnouncement}
                    onChange={(e) => setFormData({ ...formData, showAnnouncement: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {formData.showAnnouncement && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300">
                      نص الإعلان أو التوجيه الصادر للطلاب:
                    </label>
                    <textarea
                      rows={3}
                      value={formData.announcementText}
                      onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl p-3 text-slate-200 outline-none transition-colors leading-relaxed"
                      placeholder="أهلاً بكم في المنصة! يرجى إنهاء متطلبات الحقيبة الحالية..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-slate-300">
                      نمط ولون شريط التنبيه:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { type: 'emerald', label: 'أخضر قرآني (تشجيع)', colorClass: 'border-emerald-600/60 bg-emerald-950/40 text-emerald-300' },
                        { type: 'info', label: 'أزرق (إرشادي)', colorClass: 'border-sky-600/60 bg-sky-950/40 text-sky-300' },
                        { type: 'warning', label: 'كهرماني (تنبيه هام)', colorClass: 'border-amber-600/60 bg-amber-950/40 text-amber-300' },
                        { type: 'success', label: 'بنفسجي (إتقان وتكريم)', colorClass: 'border-purple-600/60 bg-purple-950/40 text-purple-300' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setFormData({ ...formData, announcementType: item.type as HomeAnnouncementType })}
                          className={`p-3 rounded-xl border text-right transition-colors cursor-pointer flex flex-col gap-1 ${
                            formData.announcementType === item.type
                              ? `${item.colorClass} ring-2 ring-amber-400 font-bold`
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live preview */}
                  <div className="space-y-1 pt-2">
                    <span className="text-[11px] text-slate-500 font-bold">معاينة حية للشريط:</span>
                    <div className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 ${
                      formData.announcementType === 'emerald' ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200' :
                      formData.announcementType === 'info' ? 'bg-sky-950/50 border-sky-800 text-sky-200' :
                      formData.announcementType === 'warning' ? 'bg-amber-950/50 border-amber-800 text-amber-200' :
                      'bg-purple-950/50 border-purple-800 text-purple-200'
                    }`}>
                      <Megaphone className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{formData.announcementText || 'معاينة نص الإعلان...'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CURRICULA & LEVELS */}
          {activeSubTab === 'curricula' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-amber-400">✨ تصنيف الحقائب وفق المستويات الأكاديمية الأربعة:</p>
                <p className="text-slate-400 leading-relaxed">
                  يمكنك هنا تحديد المستوى الأكاديمي لكل حقيبة (مبتدئ، متوسط، متقدم، أو متميز/متقن)، وإخفاء أو إظهار أي حقيبة في واجهة الطلاب، وتحديد الحقيبة الافتراضية المقترحة.
                </p>
              </div>

              {/* Featured Course Picker */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <label className="block font-bold text-slate-200">
                  الحقيبة الافتراضية المقترحة للطلاب الجدد (الحقيبة المميزة):
                </label>
                <select
                  value={formData.featuredCourseId}
                  onChange={(e) => setFormData({ ...formData, featuredCourseId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.badge || 'حقيبة'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Course-by-Course Config List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 text-xs sm:text-sm">
                  قائمة الحقائب التجويدية المقررة ({courses.length} حقائب):
                </h4>

                {courses.map((course) => {
                  const itemConfig = formData.curriculumConfigs[course.id] || {
                    courseId: course.id,
                    levelOverride: course.level || 'beginner',
                    isVisible: true,
                  };
                  const isVisible = itemConfig.isVisible !== false;
                  const currentLevel = itemConfig.levelOverride || course.level || 'beginner';

                  return (
                    <div
                      key={course.id}
                      className={`border rounded-xl p-4 transition-colors space-y-3 ${
                        isVisible
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold font-quran text-slate-100 text-sm">
                            {itemConfig.customTitle || course.title}
                          </span>
                          {formData.featuredCourseId === course.id && (
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                              الحقيبة المقترحة ⭐
                            </span>
                          )}
                        </div>

                        {/* Visibility & Featured button */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCurriculumChange(course.id, { isVisible: !isVisible })}
                            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                              isVisible
                                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
                                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                            }`}
                            title={isVisible ? 'إخفاء هذه الحقيبة من واجهة الطالب' : 'إظهار هذه الحقيبة للطلاب'}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{isVisible ? 'معروضة للطلاب' : 'مخفية'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Course Settings Form Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-xs">
                        
                        {/* Level selector */}
                        <div className="space-y-1">
                          <label className="block text-slate-400 font-medium">المستوى الأكاديمي:</label>
                          <select
                            value={currentLevel}
                            onChange={(e) => {
                              const newLevel = e.target.value as CourseLevel;
                              let levelText = 'المستوى الأول: مبتدئ';
                              if (newLevel === 'intermediate') levelText = 'المستوى الثاني: متوسط';
                              if (newLevel === 'advanced') levelText = 'المستوى الثالث: متقدم';
                              if (newLevel === 'master') levelText = 'المستوى الرابع: متميز (متقن)';
                              handleCurriculumChange(course.id, {
                                levelOverride: newLevel,
                                levelText,
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none"
                          >
                            <option value="beginner">مبتدئ (تأسيسي)</option>
                            <option value="intermediate">متوسط</option>
                            <option value="advanced">متقدم</option>
                            <option value="master">متميز (متقن / إجازة)</option>
                          </select>
                        </div>

                        {/* Custom Title Override */}
                        <div className="space-y-1">
                          <label className="block text-slate-400 font-medium">العنوان المعروض للطلاب:</label>
                          <input
                            type="text"
                            value={itemConfig.customTitle ?? ''}
                            onChange={(e) => handleCurriculumChange(course.id, { customTitle: e.target.value })}
                            placeholder={course.title}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                          />
                        </div>

                        {/* Custom Badge Override */}
                        <div className="space-y-1">
                          <label className="block text-slate-400 font-medium">الشارة الفرعية:</label>
                          <input
                            type="text"
                            value={itemConfig.customBadge ?? ''}
                            onChange={(e) => handleCurriculumChange(course.id, { customBadge: e.target.value })}
                            placeholder={course.badge || 'مثال: الحقيبة الأولى'}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                          />
                        </div>

                      </div>

                      {/* Teacher custom note on the course */}
                      <div className="space-y-1 pt-1">
                        <label className="block text-[11px] text-slate-400 font-medium">
                          توجيه أو ملاحظة المعلم الخاصة بهذه الحقيبة (تظهر للطلاب):
                        </label>
                        <input
                          type="text"
                          value={itemConfig.teacherNote ?? ''}
                          onChange={(e) => handleCurriculumChange(course.id, { teacherNote: e.target.value })}
                          placeholder="مثال: يوصى بدراسة هذه الحقيبة بعد حفظ المتن أو قبل موعد الدورة الميدانية"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: DISPLAY PREFERENCES */}
          {activeSubTab === 'display' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <label className="block font-bold text-slate-200">
                  طريقة العرض الافتراضية لقائمة الحقائب للطلاب:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      mode: 'all',
                      title: 'عرض جميع الحقائب في شبكة تفاعلية',
                      desc: 'يعرض جميع الحقائب مع شريط تصفية المستويات (مبتدئ، متوسط، متقدم، متميز)',
                    },
                    {
                      mode: 'by_level',
                      title: 'عرض مقسم ومجمع حسب المستويات الأكاديمية',
                      desc: 'يعرض أقساماً منظمة لكل مستوى (المستوى المبتدئ، المتوسط، المتقدم، المتميز)',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, defaultViewMode: opt.mode as HomeDefaultView })}
                      className={`p-3.5 rounded-xl border text-right transition-colors cursor-pointer space-y-1 ${
                        formData.defaultViewMode === opt.mode
                          ? 'border-amber-400 bg-amber-400/10 text-slate-100 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold">{opt.title}</div>
                      <div className="text-[11px] text-slate-400 font-normal leading-relaxed">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 block">شريط الدروس المفضلة السريع</span>
                    <span className="text-xs text-slate-400 block">
                      إظهار شريط بطاقات الدروس المفضلة المحفوظة للطالب في الصفحة الرئيسية
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.showFavoritesStrip}
                    onChange={(e) => setFormData({ ...formData, showFavoritesStrip: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 block">إمكانية تغيير الحقيبة الحالية من قبل الطالب</span>
                    <span className="text-xs text-slate-400 block">
                      السماح للطالب بتحديد الحقيبة التي يركز عليها حالياً وتثبيتها في أعلى الواجهة
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowStudentChangeActiveBag}
                    onChange={(e) => setFormData({ ...formData, allowStudentChangeActiveBag: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 flex-wrap">
          
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="text-xs text-slate-400 hover:text-rose-400 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="استعادة النصوص الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الإعدادات الأصلية</span>
          </button>

          <div className="flex items-center gap-2 mr-auto">
            {saveSuccessMessage && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>تم الحفظ والنشر بنجاح!</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ ونشر التعديلات للطلاب'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
