import React, { useState, useEffect } from 'react';
import { 
  X, BookOpen, Plus, Search, Trash2, Pin, PinOff, 
  Edit3, Save, Tag, FileText, Check, Sparkles, Printer, 
  Download, Calendar, AlertCircle, ChevronLeft
} from 'lucide-react';
import { 
  StudentNote, getStudentNotes, saveStudentNote, 
  deleteStudentNote, togglePinStudentNote, subscribeStudentNotes 
} from '../utils/studentNotesStorage';
import { ALL_COURSES, getCourseById } from '../data/courses';

interface StudentNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourseId?: string;
  currentUnitNumber?: number;
  currentUnitTitle?: string;
}

export const StudentNotesDrawer: React.FC<StudentNotesDrawerProps> = ({
  isOpen,
  onClose,
  activeCourseId = 'sakinan',
  currentUnitNumber,
  currentUnitTitle,
}) => {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCourseId, setFormCourseId] = useState(activeCourseId);
  const [formUnitNum, setFormUnitNum] = useState<number | undefined>(currentUnitNumber);
  const [formUnitTitle, setFormUnitTitle] = useState<string | undefined>(currentUnitTitle);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setNotes(getStudentNotes());
    };
    refresh();
    const unsub = subscribeStudentNotes(refresh);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeCourseId) {
      setFormCourseId(activeCourseId);
    }
    if (currentUnitNumber) {
      setFormUnitNum(currentUnitNumber);
    }
    if (currentUnitTitle) {
      setFormUnitTitle(currentUnitTitle);
    }
  }, [activeCourseId, currentUnitNumber, currentUnitTitle]);

  if (!isOpen) return null;

  const currentCourseObj = getCourseById(formCourseId) || ALL_COURSES[0];

  const handleStartCreate = () => {
    setEditingNoteId(null);
    setFormTitle('');
    setFormContent('');
    setFormCourseId(activeCourseId);
    setFormUnitNum(currentUnitNumber);
    setFormUnitTitle(currentUnitTitle);
    setFormTags(['تجويد', currentCourseObj.title.split(' ')[0] || 'فائدة']);
    setIsCreating(true);
  };

  const handleStartEdit = (note: StudentNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCourseId(note.courseId);
    setFormUnitNum(note.unitNumber);
    setFormUnitTitle(note.unitTitle);
    setFormTags(note.tags || []);
    setIsCreating(true);
  };

  const handleAddTag = (tag: string) => {
    const clean = tag.trim().replace(/^#/, '');
    if (clean && !formTags.includes(clean)) {
      setFormTags([...formTags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formContent.trim()) return;

    const courseObj = getCourseById(formCourseId);
    saveStudentNote({
      id: editingNoteId || undefined,
      courseId: formCourseId,
      courseTitle: courseObj?.title || 'ملاحظات عامة',
      unitNumber: formUnitNum,
      unitTitle: formUnitTitle,
      title: formTitle.trim() || 'ملاحظة تجويدية',
      content: formContent.trim(),
      tags: formTags,
      isPinned: false,
    });

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    setIsCreating(false);
    setEditingNoteId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل تريد حذف هذه الملاحظة بالتأكيد؟')) {
      deleteStudentNote(id);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (filterCourse !== 'all' && n.courseId !== filterCourse) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchContent = (n.content || '').toLowerCase().includes(q);
      const matchTag = (n.tags || []).some((t) => (t || '').toLowerCase().includes(q));
      const matchUnit = (n.unitTitle || '').toLowerCase().includes(q);
      return matchTitle || matchContent || matchTag || matchUnit;
    }
    return true;
  });

  // Sort pinned first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Quick preset templates
  const applyPreset = (titleText: string, contentPrefix: string, tag: string) => {
    setFormTitle(titleText);
    setFormContent((prev) => (prev ? `${prev}\n\n${contentPrefix}` : contentPrefix));
    if (!formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-start font-tajawal dir-rtl no-print animate-in fade-in duration-200">
      <div className="bg-slate-900 border-l border-emerald-700/60 w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden text-slate-100 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 border-b border-emerald-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 border border-amber-400/30 rounded-2xl text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-300 font-bold font-quran bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  المفكرة الشخصية
                </span>
                <span className="text-xs text-slate-400 font-sans font-bold">({notes.length} ملاحظة)</span>
              </div>
              <h2 className="text-lg font-black font-quran text-amber-100">
                مفكرة الطالب التجويدية
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={handleStartCreate}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold font-quran px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>تدوين جديد</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
              title="إغلاق المفكرة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save Toast */}
        {saveToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold font-quran px-4 py-2 flex items-center justify-center gap-2 shrink-0 animate-in slide-in-from-top duration-150">
            <Check className="w-4 h-4" />
            <span>تم حفظ الملاحظة بنجاح في ملفك الدراسي!</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

          {/* If Create / Edit Mode is active */}
          {isCreating ? (
            <form onSubmit={handleSave} className="space-y-4 bg-slate-950/80 border border-emerald-700/50 rounded-2xl p-4.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold font-quran text-amber-300 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>{editingNoteId ? 'تعديل الملاحظة' : 'تدوين ملاحظة جديدة'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

              {/* Course & Unit Binding */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-quran">الحقيبة التجويدية:</label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-quran focus:border-amber-400 focus:outline-none"
                  >
                    {ALL_COURSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                    <option value="general">ملاحظات عامة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-quran">الباب / الدرس المرتبط:</label>
                  <input
                    type="text"
                    value={formUnitTitle || ''}
                    onChange={(e) => setFormUnitTitle(e.target.value)}
                    placeholder="مثال: الباب الثاني - الإدغام بغنة"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 font-tajawal focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-quran">قوالب سريعة للتدوين:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyPreset('تنبيه في الأداء والنطق 🎙️', '• تنبيه المعلم حول المخرج/الصفة:\n- ', 'تنبيه_نطق')}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 px-2 py-1 rounded-lg font-quran transition-colors cursor-pointer"
                  >
                    + تنبيه نطق
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('استثناء قرآني مهم ⚠️', '• الكلمة المستثناة في الرواية:\n- الآية والسورة:\n- وجه الاستثناء:', 'استثناء')}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-rose-300 px-2 py-1 rounded-lg font-quran transition-colors cursor-pointer"
                  >
                    + استثناء رواية
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('سؤال واستفسار للمعلم ❓', '• نص السؤال للاستفسار عنه في المجلس:\n- ', 'سؤال_معلم')}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-sky-500/30 text-sky-300 px-2 py-1 rounded-lg font-quran transition-colors cursor-pointer"
                  >
                    + سؤال للمشرف
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('بيت منظومة للحفظ 📜', '• الشاهد من المنظومة (التحفة/الجزرية):\n- ', 'منظومات')}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded-lg font-quran transition-colors cursor-pointer"
                  >
                    + شاهد منظومة
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-quran">عنوان الملاحظة:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: الفرق بين الإظهار الحلقي والمطلق في التطبيق..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 font-bold font-quran placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-quran">نص الملاحظة والتفصيل:</label>
                <textarea
                  required
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="اكتب ملاحظاتك، فوائدك، أمثلتك، أو التنبيهات الخاصة بالنطق والأداء هنا..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 font-tajawal leading-relaxed focus:border-amber-400 focus:outline-none"
                ></textarea>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-quran">الوسوم والتصنيفات:</label>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {formTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] px-2 py-0.5 rounded-lg font-quran"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-red-400 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    placeholder="أضف وسماً واضغط Enter..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-tajawal focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl transition-all cursor-pointer font-quran"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer font-quran flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ الملاحظة</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* Search & Filter Bar */}
          {!isCreating && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في عناوين الملاحظات أو محتواها أو وسومها..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pr-9 pl-4 py-2 text-xs text-slate-200 placeholder-slate-500 font-tajawal focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Course filter buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setFilterCourse('all')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold font-quran transition-all cursor-pointer shrink-0 ${
                    filterCourse === 'all'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  الكل ({notes.length})
                </button>
                {ALL_COURSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFilterCourse(c.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold font-quran transition-all cursor-pointer shrink-0 ${
                      filterCourse === c.id
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {c.title.split(' ')[0]} ({notes.filter((n) => n.courseId === c.id).length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes List */}
          {!isCreating && (
            <div className="space-y-3">
              {sortedNotes.length === 0 ? (
                <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-quran text-slate-300">
                      لا توجد ملاحظات مدونة حتى الآن
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      استخدم المفكرة لتدوين فوائدك التجويدية، التنبيهات الصوتية الخاصة بكل باب، واستفساراتك لمناقشتها مع المعلم.
                    </p>
                  </div>
                  <button
                    onClick={handleStartCreate}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold font-quran px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تدوين أول فائدة</span>
                  </button>
                </div>
              ) : (
                sortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 relative group ${
                      note.isPinned
                        ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {note.isPinned && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-quran flex items-center gap-1">
                              <Pin className="w-3 h-3 fill-current" />
                              <span>مثبتة</span>
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-300 font-bold font-quran bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                            {note.courseTitle}
                          </span>
                          {note.unitTitle && (
                            <span className="text-[10px] text-slate-400 font-tajawal">
                              {note.unitTitle}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold font-quran text-amber-200 mt-1">
                          {note.title}
                        </h3>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => togglePinStudentNote(note.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            note.isPinned
                              ? 'text-amber-400 hover:bg-amber-400/20'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                          }`}
                          title={note.isPinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="تعديل الملاحظة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="حذف الملاحظة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="text-xs text-slate-300 font-tajawal leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                      {note.content}
                    </div>

                    {/* Tags & Date Footer */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {note.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800 font-quran"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 font-sans">
                        <Calendar className="w-3 h-3" />
                        <span>{note.updatedAt || note.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-400 text-[11px] font-tajawal flex items-center gap-1.5">
            <span>ملاحظاتك محفوظة سحابياً ومحلياً على جهازك</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold font-quran px-5 py-2 rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
