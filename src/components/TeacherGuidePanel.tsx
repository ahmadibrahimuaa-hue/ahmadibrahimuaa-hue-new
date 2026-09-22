import React, { useState, useMemo } from 'react';
import { 
  FileText, BookOpen, CheckCircle2, Copy, Check, Printer, 
  ChevronDown, ChevronUp, Search, Eye, Sparkles, UserCheck, 
  ShieldCheck, Edit3, Save, X, RotateCcw, Award, Layers
} from 'lucide-react';
import { Course, Unit, Lesson } from '../types';
import { getAllCourses } from '../data/courses';
import { addLessonToUnit } from '../utils/courseCustomStorage';

interface TeacherGuidePanelProps {
  activeCourseId?: string;
  onSelectCourseToView?: (courseId: string) => void;
}

export const TeacherGuidePanel: React.FC<TeacherGuidePanelProps> = ({
  activeCourseId = 'sakinan',
  onSelectCourseToView
}) => {
  const [courses, setCourses] = useState<Course[]>(() => getAllCourses());
  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourseId || 'sakinan');
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLessonIds, setExpandedLessonIds] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Inline editing state for teacher customization
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editDiscussionAnswers, setEditDiscussionAnswers] = useState<string[]>([]);
  const [editHomeworkSolution, setEditHomeworkSolution] = useState<string>('');
  const [editRecitationGuide, setEditRecitationGuide] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  const activeUnits = useMemo(() => {
    return activeCourse?.units || [];
  }, [activeCourse]);

  const currentUnit = useMemo(() => {
    return activeUnits.find((u) => u.unitNumber === selectedUnitNumber) || activeUnits[0];
  }, [activeUnits, selectedUnitNumber]);

  const lessons = useMemo(() => {
    return currentUnit?.lessons || [];
  }, [currentUnit]);

  // Filter lessons by search query if any
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return lessons;
    const q = searchQuery.toLowerCase().trim();
    return lessons.filter((l) => {
      const inTitle = l.title.toLowerCase().includes(q) || (l.subtitle && l.subtitle.toLowerCase().includes(q));
      const inQuestions = (l.discussionQuestions || []).some((dq) => dq.toLowerCase().includes(q));
      const inAnswers = (l.discussionAnswers || []).some((da) => da.toLowerCase().includes(q));
      const inHw = (l.homeworkTask && l.homeworkTask.toLowerCase().includes(q)) || 
                   (l.homeworkSolution && l.homeworkSolution.toLowerCase().includes(q));
      const inRec = (l.recitationTask && l.recitationTask.toLowerCase().includes(q)) ||
                    (l.recitationGuide && l.recitationGuide.toLowerCase().includes(q));
      return inTitle || inQuestions || inAnswers || inHw || inRec;
    });
  }, [lessons, searchQuery]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedLessonIds((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    lessons.forEach((l) => {
      all[l.id] = true;
    });
    setExpandedLessonIds(all);
  };

  const collapseAll = () => {
    const none: Record<string, boolean> = {};
    lessons.forEach((l) => {
      none[l.id] = false;
    });
    setExpandedLessonIds(none);
  };

  const handleStartEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditDiscussionAnswers([...(lesson.discussionAnswers || [])]);
    // Ensure we have answer slots for all questions
    const qCount = lesson.discussionQuestions?.length || 0;
    if (editDiscussionAnswers.length < qCount) {
      const newAnswers = [...(lesson.discussionAnswers || [])];
      while (newAnswers.length < qCount) {
        newAnswers.push('');
      }
      setEditDiscussionAnswers(newAnswers);
    }
    setEditHomeworkSolution(lesson.homeworkSolution || '');
    setEditRecitationGuide(lesson.recitationGuide || '');
  };

  const handleSaveEdit = (lesson: Lesson) => {
    if (!currentUnit) return;
    const updatedLesson: Lesson = {
      ...lesson,
      discussionAnswers: editDiscussionAnswers,
      homeworkSolution: editHomeworkSolution.trim(),
      recitationGuide: editRecitationGuide.trim(),
    };

    const success = addLessonToUnit(activeCourse.id, currentUnit.id, updatedLesson);
    if (success) {
      setCourses(getAllCourses());
      setEditingLessonId(null);
      setSaveSuccessMsg(`تم حفظ وتحديث إجابات "${lesson.title}" بنجاح!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } else {
      alert('حدث خطأ أثناء حفظ التعديلات.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-tajawal text-right dir-rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 text-slate-950 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow-md shrink-0">
              <UserCheck className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-slate-950 text-amber-300 text-[11px] font-bold px-3 py-0.5 rounded-full font-quran flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  نسخة المعلم والمدرب المعتمدة
                </span>
                <span className="bg-white/90 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  🔒 محجوب تلقائياً عن حسابات وشاشات الطلاب
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-quran text-slate-950 mt-1">
                دليل المعلم: إجابات أسئلة المناقشة ونماذج تصحيح الواجبات والتلاوة
              </h2>
              <p className="text-xs text-slate-900 font-medium max-w-2xl mt-0.5">
                يتضمن هذا الدليل الحلول التأصيلية الدقيقة للأسئلة التفاعلية، ونماذج إجابة الواجب المنزلي، وتوجيهات الاستماع للتلاوة لمساعدة المعلم في إدارة النقاشات الصفية وتصحيح التكليفات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 no-print">
            <button
              onClick={handlePrint}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              title="طباعة الدليل النموذجي"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الدليل</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 p-3 rounded-xl text-xs font-bold font-quran flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Course & Unit Selectors */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 no-print text-white">
        {/* Course Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold font-quran text-amber-300">
              اختر الحقيبة التدريبية:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {courses.map((c) => {
              const isSelected = c.id === selectedCourseId;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCourseId(c.id);
                    setSelectedUnitNumber(1);
                    if (onSelectCourseToView) onSelectCourseToView(c.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {c.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unit Selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold font-quran text-slate-300 flex items-center gap-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              أبواب الحقيبة ({activeUnits.length}):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeUnits.map((u) => {
                const isSelected = u.unitNumber === selectedUnitNumber;
                return (
                  <button
                    key={u.id || u.unitNumber}
                    onClick={() => setSelectedUnitNumber(u.unitNumber)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    الباب {u.unitNumber}: {u.title.split(':')[1] || u.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Expand/Collapse buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-[11px] text-amber-300/80 hover:text-amber-300 hover:underline cursor-pointer"
            >
              توسيع الكل
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={collapseAll}
              className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
            >
              طي الكل
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في نصوص الأسئلة، الإجابات، الواجبات المنزلية، أو توجيهات التلاوة..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-tajawal"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-white text-xs"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Selected Unit Title Banner */}
      {currentUnit && (
        <div className="border-r-4 border-amber-400 bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold text-amber-900 font-quran">
              الباب المعروض حالياً:
            </div>
            <h3 className="text-base sm:text-lg font-black font-quran text-slate-900 mt-0.5">
              {currentUnit.title}
            </h3>
            <p className="text-xs text-slate-600">{currentUnit.description}</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto font-quran">
            عدد الدروس: {currentUnit.lessons?.length || 0} درس
          </span>
        </div>
      )}

      {/* Lessons List with Detailed Teacher Answers */}
      <div className="space-y-6">
        {filteredLessons.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold font-quran text-slate-700">لا توجد دروس مطابقة لبحثك</h4>
            <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو اختر باباً مختلفاً من الأبواب أعلاه.</p>
          </div>
        ) : (
          filteredLessons.map((lesson) => {
            const isExpanded = expandedLessonIds[lesson.id] !== false; // expanded by default
            const isEditing = editingLessonId === lesson.id;
            const hasQuestions = lesson.discussionQuestions && lesson.discussionQuestions.length > 0;
            const hasAnswers = lesson.discussionAnswers && lesson.discussionAnswers.length > 0;

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-400/60 transition-all shadow-sm overflow-hidden"
              >
                {/* Lesson Header Accordion Toggle */}
                <div
                  onClick={() => !isEditing && toggleExpand(lesson.id)}
                  className="bg-slate-50 p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-200 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center font-quran shadow-sm shrink-0">
                      0{lesson.lessonNumber}
                    </div>
                    <div>
                      <h4 className="text-base font-bold font-quran text-slate-900">
                        {lesson.title}
                      </h4>
                      {lesson.subtitle && (
                        <p className="text-xs text-slate-500">{lesson.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-quran hidden sm:inline-flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      إجابات ونموذج المعلم
                    </span>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(lesson);
                        }}
                        className="bg-slate-200 hover:bg-amber-400 text-slate-800 hover:text-slate-950 p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 font-quran"
                        title="تعديل وتخصيص إجابات هذا الدرس"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline text-[10px]">تعديل الإجابات</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Lesson Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 space-y-5">
                    {/* EDITING FORM FOR TEACHER */}
                    {isEditing ? (
                      <div className="bg-amber-50/70 p-4 rounded-xl border-2 border-amber-300 space-y-4">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                          <span className="text-xs font-bold font-quran text-amber-950 flex items-center gap-1.5">
                            <Edit3 className="w-4 h-4 text-amber-700" />
                            تعديل إجابات المعلم المعتمدة لدرس ({lesson.title}):
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingLessonId(null)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Discussion Answers Edit */}
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-900 font-quran">
                            إجابات أسئلة المناقشة التفاعلية:
                          </label>
                          {(lesson.discussionQuestions || []).map((q, qIdx) => (
                            <div key={qIdx} className="space-y-1 bg-white p-3 rounded-lg border border-amber-200">
                              <span className="text-xs font-bold text-slate-800 font-quran">
                                س{qIdx + 1}: {q}
                              </span>
                              <textarea
                                rows={3}
                                value={editDiscussionAnswers[qIdx] || ''}
                                onChange={(e) => {
                                  const updated = [...editDiscussionAnswers];
                                  updated[qIdx] = e.target.value;
                                  setEditDiscussionAnswers(updated);
                                }}
                                placeholder="اكتب إجابة المعلم وتوجيهات الشرح..."
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-tajawal text-slate-900"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Homework Solution Edit */}
                        <div className="space-y-1 bg-white p-3 rounded-lg border border-purple-200">
                          <label className="block text-xs font-bold text-purple-950 font-quran">
                            نموذج إجابة وتصحيح الواجب المنزلي:
                          </label>
                          <textarea
                            rows={4}
                            value={editHomeworkSolution}
                            onChange={(e) => setEditHomeworkSolution(e.target.value)}
                            placeholder="اكتب الحل النموذجي المعتمد للواجب المنزلي..."
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg font-tajawal text-slate-900"
                          />
                        </div>

                        {/* Recitation Guide Edit */}
                        <div className="space-y-1 bg-white p-3 rounded-lg border border-emerald-200">
                          <label className="block text-xs font-bold text-emerald-950 font-quran">
                            توجيهات المعلم عند الاستماع للتلاوة:
                          </label>
                          <textarea
                            rows={3}
                            value={editRecitationGuide}
                            onChange={(e) => setEditRecitationGuide(e.target.value)}
                            placeholder="اكتب توجيهات الاستماع للتلاوة والأخطاء الشائعة..."
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg font-tajawal text-slate-900"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingLessonId(null)}
                            className="bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-quran"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(lesson)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg font-quran flex items-center gap-1.5 shadow"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>حفظ التعديلات في الدليل</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 1. DISCUSSION QUESTIONS & TEACHER ANSWERS */}
                        <div className="bg-amber-50/70 rounded-xl p-4 sm:p-5 border border-amber-200 space-y-3">
                          <div className="flex items-center justify-between border-b border-amber-200 pb-2 flex-wrap gap-2">
                            <span className="font-black text-amber-950 font-quran text-sm flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                              أسئلة المناقشة التفاعلية وإجابات الشرح النموذجية:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const allText = (lesson.discussionQuestions || []).map((q, i) => {
                                  const ans = lesson.discussionAnswers?.[i] || 'انظر الشرح والتأصيل في الدرس';
                                  return `سؤال: ${q}\nإجابة وتوجيه المعلم: ${ans}`;
                                }).join('\n\n');
                                handleCopy(`dq_${lesson.id}`, allText);
                              }}
                              className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-all"
                            >
                              {copiedKey === `dq_${lesson.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>تم النسخ!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>نسخ أسئلة وإجابات المناقشة</span>
                                </>
                              )}
                            </button>
                          </div>

                          {(!lesson.discussionQuestions || lesson.discussionQuestions.length === 0) ? (
                            <p className="text-xs text-slate-500">لا توجد أسئلة مناقشة مضافة لهذا الدرس.</p>
                          ) : (
                            <div className="space-y-3">
                              {lesson.discussionQuestions.map((q, qIdx) => {
                                const ans = lesson.discussionAnswers?.[qIdx];
                                return (
                                  <div key={qIdx} className="bg-white p-3.5 rounded-xl border border-amber-200/90 shadow-2xs space-y-2">
                                    <div className="flex items-start gap-2">
                                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded font-quran shrink-0 mt-0.5">
                                        سؤال 0{qIdx + 1}
                                      </span>
                                      <span className="font-bold text-slate-900 text-xs sm:text-sm font-quran leading-relaxed">
                                        {q}
                                      </span>
                                    </div>

                                    {/* Detailed Teacher Answer Box */}
                                    <div className="bg-amber-100/80 rounded-lg p-3 border-r-4 border-amber-600 text-xs space-y-1 mt-2">
                                      <span className="font-black text-amber-950 font-quran text-xs flex items-center gap-1.5">
                                        <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                                        إجابة وتوجيهات المعلم للنقاش مع المتدربين:
                                      </span>
                                      <p className="text-slate-800 font-tajawal leading-relaxed text-xs sm:text-[13px] whitespace-pre-line">
                                        {ans || 'يُوجّه الطلاب إلى استخراج الحكم من الشرح النظري في متون التجويد ومراعاة التطبيق الصوتي.'}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. HOMEWORK TASK & TEACHER MODEL SOLUTION */}
                        <div className="bg-purple-50/70 rounded-xl p-4 sm:p-5 border border-purple-200 space-y-3">
                          <div className="flex items-center justify-between border-b border-purple-200 pb-2 flex-wrap gap-2">
                            <span className="font-black text-purple-950 font-quran text-sm flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-purple-600" />
                              الواجب المنزلي المطلوب ونموذج الإجابة والتصحيح:
                            </span>
                            {lesson.homeworkSolution && (
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `الواجب المطلوب: ${lesson.homeworkTask}\n\nنموذج الحل والتصحيح للمعلم:\n${lesson.homeworkSolution}`;
                                  handleCopy(`hw_${lesson.id}`, text);
                                }}
                                className="text-[11px] font-bold text-purple-900 hover:text-purple-950 flex items-center gap-1 bg-purple-200/80 hover:bg-purple-300 px-2.5 py-1 rounded-lg transition-all"
                              >
                                {copiedKey === `hw_${lesson.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-700" />
                                    <span>تم النسخ!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>نسخ نموذج الحل</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="bg-white p-3 rounded-xl border border-purple-200 text-xs">
                              <span className="font-bold text-purple-900 font-quran block mb-1">
                                التكليف المنزلي المطلوب من المتدرب:
                              </span>
                              <p className="text-slate-800 leading-relaxed font-tajawal">
                                {lesson.homeworkTask || 'لا يوجد واجب منزلي محدد.'}
                              </p>
                            </div>

                            {/* Teacher Model Solution */}
                            <div className="bg-purple-100/90 rounded-xl p-3.5 border-r-4 border-purple-600 text-xs space-y-1.5">
                              <span className="font-black text-purple-950 font-quran text-xs flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-purple-800" />
                                نموذج الإجابة المعتمد ومعايير التصحيح لنسخة المعلم:
                              </span>
                              <p className="text-slate-900 font-tajawal leading-relaxed whitespace-pre-line text-xs sm:text-[13px]">
                                {lesson.homeworkSolution || 'يصحح المعلم التطبيق بمطابقة الأمثلة المستخرجة مع الشروط والقواعد المحددة في الباب والتأكد من صحة التوجيه الإعرابي والتجويدي.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 3. RECITATION TASK & TEACHER GUIDELINES */}
                        <div className="bg-emerald-50/70 rounded-xl p-4 sm:p-5 border border-emerald-200 space-y-3">
                          <div className="flex items-center justify-between border-b border-emerald-200 pb-2 flex-wrap gap-2">
                            <span className="font-black text-emerald-950 font-quran text-sm flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-emerald-700" />
                              التكليف التطبيقي في التلاوة وتوجيهات المعلم:
                            </span>
                            {lesson.recitationGuide && (
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `تكليف التلاوة: ${lesson.recitationTask}\n\nتوجيهات المعلم عند الاستماع:\n${lesson.recitationGuide}`;
                                  handleCopy(`rec_${lesson.id}`, text);
                                }}
                                className="text-[11px] font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 bg-emerald-200/80 hover:bg-emerald-300 px-2.5 py-1 rounded-lg transition-all"
                              >
                                {copiedKey === `rec_${lesson.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-700" />
                                    <span>تم النسخ!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>نسخ توجيه التلاوة</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs">
                              <span className="font-bold text-emerald-950 font-quran block mb-1">
                                موضع التلاوة المطلوب تطبيقه عملياً:
                              </span>
                              <p className="text-slate-800 leading-relaxed font-tajawal">
                                {lesson.recitationTask || 'تلاوة الآيات المحددة في الدرس.'}
                              </p>
                            </div>

                            {/* Recitation Guidance */}
                            <div className="bg-emerald-100/90 rounded-xl p-3.5 border-r-4 border-emerald-600 text-xs space-y-1.5">
                              <span className="font-black text-emerald-950 font-quran text-xs flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-800" />
                                توجيه المعلم والمدرب للطلاب عند الاستماع للتلاوة:
                              </span>
                              <p className="text-slate-900 font-tajawal leading-relaxed text-xs sm:text-[13px]">
                                {lesson.recitationGuide || 'التركيز على خفة الانتقال وسلاسة النطق وتحقيق مخارج الحروف وصفاتها دون تكلف أو تمطيط زائد للحركات.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
