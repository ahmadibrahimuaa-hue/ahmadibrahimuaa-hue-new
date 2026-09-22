import React, { useState } from 'react';
import { Course, Unit, Lesson, CourseLevel } from '../types';
import { 
  getCustomStoredCourses, 
  moveLessonBetweenBags, 
  createBagWithLesson 
} from '../utils/courseCustomStorage';
import { 
  FolderSync, 
  PlusCircle, 
  CheckCircle2, 
  Layers, 
  X, 
  Bookmark, 
  FolderPlus, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

interface LessonClassifierModalProps {
  initialCourseId?: string;
  initialUnitId?: string;
  initialLessonId?: string;
  onClose: () => void;
  onSuccess?: (targetCourseId: string) => void;
}

export const LessonClassifierModal: React.FC<LessonClassifierModalProps> = ({
  initialCourseId,
  initialUnitId,
  initialLessonId,
  onClose,
  onSuccess,
}) => {
  const [courses, setCourses] = useState<Course[]>(() => getCustomStoredCourses());
  
  // Flatten all lessons across all courses for the selector
  const allLessonsFlat = courses.flatMap((course) =>
    (course.units || []).flatMap((unit) =>
      (unit.lessons || []).map((lesson) => ({
        courseId: course.id,
        courseTitle: course.title,
        courseLevel: course.level,
        courseLevelText: course.levelText,
        unitId: unit.id,
        unitTitle: unit.title,
        lesson,
      }))
    )
  );

  // Selected lesson to classify
  const [selectedLessonKey, setSelectedLessonKey] = useState<string>(() => {
    if (initialCourseId && initialUnitId && initialLessonId) {
      return `${initialCourseId}:::${initialUnitId}:::${initialLessonId}`;
    }
    // Default to first lesson found or first of foundational lessons
    const foundFirst = allLessonsFlat.find((item) => item.lesson.id.includes('istiadha') || item.courseId === 'foundational_rules') || allLessonsFlat[0];
    return foundFirst ? `${foundFirst.courseId}:::${foundFirst.unitId}:::${foundFirst.lesson.id}` : '';
  });

  const selectedItem = allLessonsFlat.find(
    (item) => `${item.courseId}:::${item.unitId}:::${item.lesson.id}` === selectedLessonKey
  );

  // Target Destination Mode: 'existing_bag' | 'new_bag'
  const [targetMode, setTargetMode] = useState<'existing_bag' | 'new_bag'>('existing_bag');

  // Existing Bag target state
  const [targetCourseId, setTargetCourseId] = useState<string>(() => {
    return initialCourseId || courses[0]?.id || '';
  });

  const targetCourse = courses.find((c) => c.id === targetCourseId) || courses[0];

  const [targetUnitId, setTargetUnitId] = useState<string>('__new__');
  const [newUnitTitle, setNewUnitTitle] = useState<string>('');

  // Target Level selection
  const [targetLevel, setTargetLevel] = useState<CourseLevel>(() => targetCourse?.level || 'beginner');
  const [targetLevelText, setTargetLevelText] = useState<string>(() => targetCourse?.levelText || 'المستوى الأول (تأسيسي)');

  // New Bag state
  const [newBagTitle, setNewBagTitle] = useState<string>('');
  const [newBagSubtitle, setNewBagSubtitle] = useState<string>('');
  const [newBagLevel, setNewBagLevel] = useState<CourseLevel>('beginner');
  const [newBagBadge, setNewBagBadge] = useState<string>('حقيبة جديدة');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const levelOptions: { value: CourseLevel; label: string; desc: string; color: string }[] = [
    { value: 'beginner', label: 'المستوى الأول (تأسيسي ومبتدئ)', desc: 'للمبتدئين ودارسي الأساسيات وأحكام التلاوة الأولية', color: 'bg-emerald-500' },
    { value: 'intermediate', label: 'المستوى الثاني (متوسط وتطبيقي)', desc: 'للأحكام التطبيقية كالإدغام وأحكام المدود والساكنين', color: 'bg-blue-500' },
    { value: 'advanced', label: 'المستوى الثالث (متقدم وتخصصي)', desc: 'لمخارج الحروف وصفاتها والتحريرات الدقيقة', color: 'bg-amber-500' },
    { value: 'master', label: 'المستوى الرابع (إتقان وإجازة)', desc: 'لمسائل الإجازات وطرق الشاطبية والطيبة والضبط المتقن', color: 'bg-purple-500' },
  ];

  const handleLevelChange = (lvl: CourseLevel) => {
    setTargetLevel(lvl);
    const found = levelOptions.find((l) => l.value === lvl);
    if (found) {
      setTargetLevelText(found.label);
    }
  };

  const handleExecuteMove = () => {
    if (!selectedItem) {
      setFeedback({ type: 'error', message: 'يرجى تحديد الدرس المراد تصنيفه أولاً' });
      return;
    }

    if (targetMode === 'new_bag') {
      if (!newBagTitle.trim()) {
        setFeedback({ type: 'error', message: 'يرجى إدخال اسم الحقيبة الجديدة' });
        return;
      }

      const success = createBagWithLesson(
        {
          title: newBagTitle.trim(),
          subtitle: newBagSubtitle.trim() || 'حقيبة تجويدية مستقلة',
          level: newBagLevel,
          levelText: levelOptions.find((l) => l.value === newBagLevel)?.label || 'المستوى الأول',
          badge: newBagBadge.trim() || 'حقيبة مخصصة',
        },
        selectedItem.lesson,
        newUnitTitle.trim() || undefined
      );

      if (success) {
        setFeedback({ type: 'success', message: `تم بنجاح إنشاء حقيبة "${newBagTitle}" وإدراج الدرس فيها بنجاح!` });
        setCourses(getCustomStoredCourses());
        setTimeout(() => {
          onSuccess?.(targetCourseId);
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: 'حدث خطأ أثناء إنشاء الحقيبة الجديدة.' });
      }
      return;
    }

    // Existing bag target
    if (!targetCourseId) {
      setFeedback({ type: 'error', message: 'يرجى اختيار الحقيبة المستهدفة' });
      return;
    }

    const success = moveLessonBetweenBags({
      sourceCourseId: selectedItem.courseId,
      sourceUnitId: selectedItem.unitId,
      lessonId: selectedItem.lesson.id,
      targetCourseId,
      targetUnitId,
      targetLevel,
      targetLevelText,
      newUnitTitle: newUnitTitle.trim() || undefined,
    });

    if (success) {
      const destCourse = courses.find((c) => c.id === targetCourseId);
      setFeedback({
        type: 'success',
        message: `تم بنجاح تصنيف ونقل درس "${selectedItem.lesson.title}" إلى حقيبة "${destCourse?.title || targetCourseId}" في المستوى المحدد!`,
      });
      setCourses(getCustomStoredCourses());
      setTimeout(() => {
        onSuccess?.(targetCourseId);
        onClose();
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: 'تعذر نقل الدرس، يرجى التحقق من الخيارات المدخلة.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn dir-rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-quran">منسّق ومصنّف الدروس والحقائب</h2>
              <p className="text-xs text-emerald-200">
                صنّف أي درس، وانقله للحقيبة التي تريدها، أو أنشئ له حقيبة ومستوى دراسياً جديداً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 text-slate-800 dark:text-slate-100 font-tajawal">
          
          {feedback && (
            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fadeIn ${
              feedback.type === 'success' 
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <X className="w-5 h-5 shrink-0 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Step 1: Select Lesson */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. اختر الدرس المراد تصنيفه وتحديد مكانه:</span>
            </label>
            <select
              value={selectedLessonKey}
              onChange={(e) => setSelectedLessonKey(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {allLessonsFlat.map((item) => (
                <option
                  key={`${item.courseId}:::${item.unitId}:::${item.lesson.id}`}
                  value={`${item.courseId}:::${item.unitId}:::${item.lesson.id}`}
                >
                  {item.lesson.title} — [حقيبة: {item.courseTitle}]
                </option>
              ))}
            </select>

            {/* Current Lesson Location Card */}
            {selectedItem && (
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-700 dark:text-emerald-400 font-quran text-sm">
                    {selectedItem.lesson.title}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300">
                    {selectedItem.courseLevelText || selectedItem.courseLevel}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  الحقيبة الحالية: <strong className="text-slate-800 dark:text-slate-200">{selectedItem.courseTitle}</strong> • الباب الحالي: <strong className="text-slate-800 dark:text-slate-200">{selectedItem.unitTitle}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Target Bag Strategy */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. إلى أين تريد نقل وتصنيف هذا الدرس؟</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetMode('existing_bag')}
                className={`p-3.5 rounded-2xl border text-right font-bold text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                  targetMode === 'existing_bag'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">في حقيبة موجودة</span>
                  <FolderSync className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  انقل الدرس لإحدى الحقائب المتاحة وحدد المستوى
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('new_bag')}
                className={`p-3.5 rounded-2xl border text-right font-bold text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                  targetMode === 'new_bag'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-500 ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">إنشاء حقيبة جديدة</span>
                  <FolderPlus className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  أنشئ حقيبة جديدة فوراً واجعل هذا الدرس أول دروسها
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Sub-forms */}
          {targetMode === 'existing_bag' ? (
            <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              {/* Select Target Bag */}
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                  اختر الحقيبة المستهدفة:
                </label>
                <select
                  value={targetCourseId}
                  onChange={(e) => {
                    setTargetCourseId(e.target.value);
                    const selected = courses.find((c) => c.id === e.target.value);
                    if (selected) {
                      setTargetLevel(selected.level);
                      setTargetLevelText(selected.levelText || '');
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.levelText || c.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Unit in that Bag */}
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                  الباب المستهدف في الحقيبة:
                </label>
                <select
                  value={targetUnitId}
                  onChange={(e) => setTargetUnitId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="__new__">➕ إنشاء باب (وحدة) جديد لهذا الدرس تلقائياً</option>
                  {(targetCourse?.units || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title} ({u.lessons?.length || 0} دروس)
                    </option>
                  ))}
                </select>
              </div>

              {targetUnitId === '__new__' && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    عنوان الباب الجديد (اختياري):
                  </label>
                  <input
                    type="text"
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder={`مثال: الباب المستقل: ${selectedItem?.lesson.title || ''}`}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              )}

              {/* Select Level */}
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>تأكيد أو تعديل المستوى الدراسي للحقيبة:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleLevelChange(opt.value)}
                      className={`p-2.5 rounded-xl border text-right transition-all text-xs cursor-pointer ${
                        targetLevel === opt.value
                          ? 'border-emerald-600 bg-white dark:bg-slate-800 font-bold shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`}></span>
                        <span>{opt.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-normal">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                  اسم الحقيبة التدريبية الجديدة: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBagTitle}
                  onChange={(e) => setNewBagTitle(e.target.value)}
                  placeholder="مثال: حقيبة أصول التلاوة والبدء"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    العنوان الفرعي للحقيبة:
                  </label>
                  <input
                    type="text"
                    value={newBagSubtitle}
                    onChange={(e) => setNewBagSubtitle(e.target.value)}
                    placeholder="مثال: دراسة تأصيلية وتطبيقية"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    شارة الحقيبة (Badge):
                  </label>
                  <input
                    type="text"
                    value={newBagBadge}
                    onChange={(e) => setNewBagBadge(e.target.value)}
                    placeholder="مثال: حقيبة جديدة"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* Level of new bag */}
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">
                  المستوى الدراسي للحقيبة الجديدة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewBagLevel(opt.value)}
                      className={`p-2.5 rounded-xl border text-right transition-all text-xs cursor-pointer ${
                        newBagLevel === opt.value
                          ? 'border-purple-600 bg-white dark:bg-slate-800 font-bold shadow-sm ring-1 ring-purple-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`}></span>
                        <span>{opt.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-3xl flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleExecuteMove}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold font-quran flex items-center gap-2 shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تنفيذ التصنيف والتحديث فوراً</span>
          </button>
        </div>

      </div>
    </div>
  );
};
