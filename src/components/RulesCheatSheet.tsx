import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Bookmark, Copy, Check, X, Sparkles, BookOpen, 
  ChevronDown, ChevronUp, Layers, HelpCircle, ArrowUpRight, Volume2, 
  ShieldCheck, Plus, Edit3, Trash2, RotateCcw, Save, AlertCircle, 
  ArrowRight, ArrowLeft, Tag, Info
} from 'lucide-react';
import { 
  TajweedRuleItem, 
  CheatSheetCategory, 
  subscribeCheatSheetRules, 
  saveCheatSheetRule, 
  deleteCheatSheetRule, 
  resetCheatSheetRulesToDefault, 
  getDynamicCategories, 
  INITIAL_DEFAULT_RULES 
} from '../utils/tajweedCheatSheetStorage';
import { Course, TrainerAccount } from '../types';

export type { TajweedRuleItem };
export const TAJWEED_CHEAT_SHEET_DATA = INITIAL_DEFAULT_RULES;

interface RulesCheatSheetProps {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'modal' | 'embedded';
  defaultCategory?: string;
  course?: Course;
  isTeacherMode?: boolean;
  authTrainer?: TrainerAccount | null;
}

export const RulesCheatSheet: React.FC<RulesCheatSheetProps> = ({
  isOpen = true,
  onClose,
  mode = 'embedded',
  defaultCategory = 'all',
  course,
  isTeacherMode = false,
  authTrainer,
}) => {
  const [rules, setRules] = useState<TajweedRuleItem[]>(INITIAL_DEFAULT_RULES);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  // Edit / Add Modal State
  const [isEditModeEnabled, setIsEditModeEnabled] = useState<boolean>(false);
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<TajweedRuleItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>('');

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('sakinan');
  const [formCategoryLabel, setFormCategoryLabel] = useState<string>('');
  const [formUnitTitle, setFormUnitTitle] = useState<string>('');
  const [formCondition, setFormCondition] = useState<string>('');
  const [formRuling, setFormRuling] = useState<string>('');
  const [formMechanism, setFormMechanism] = useState<string>('');
  const [formImportantNote, setFormImportantNote] = useState<string>('');
  const [formEvidenceMatn, setFormEvidenceMatn] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formExamples, setFormExamples] = useState<Array<{ quranText: string; surahInfo?: string; explanation?: string }>>([
    { quranText: '', surahInfo: '', explanation: '' },
  ]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Subscribe to real-time cheat sheet rules
  useEffect(() => {
    const unsub = subscribeCheatSheetRules((updatedRules) => {
      setRules(updatedRules);
    });
    return () => unsub();
  }, []);

  // Global ESC key listener to close cheat sheet smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRuleModal) {
          setShowRuleModal(false);
          return;
        }
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
          return;
        }
        if (resetConfirmOpen) {
          setResetConfirmOpen(false);
          return;
        }
        if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showRuleModal, deleteConfirmId, resetConfirmOpen]);

  // Dynamic Categories including all courses and all units (الأبواب)
  const categories = useMemo(() => {
    return getDynamicCategories();
  }, [course]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    let list = rules;

    if (selectedCategory !== 'all') {
      list = list.filter((r) => {
        if (r.category === selectedCategory) return true;
        if (r.courseId && r.courseId === selectedCategory) return true;
        if (selectedCategory.startsWith('unit_')) {
          // Check matching unit
          if (r.unitId && selectedCategory.includes(r.unitId)) return true;
          if (r.unitTitle && selectedCategory.includes(r.unitTitle)) return true;
        }
        return false;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((r) => 
        r.title.toLowerCase().includes(q) ||
        r.condition.toLowerCase().includes(q) ||
        r.mechanism.toLowerCase().includes(q) ||
        (r.categoryLabel && r.categoryLabel.toLowerCase().includes(q)) ||
        (r.unitTitle && r.unitTitle.toLowerCase().includes(q)) ||
        (r.letters && r.letters.toLowerCase().includes(q)) ||
        (r.importantNote && r.importantNote.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.examples.some((e) => e.quranText.includes(q) || (e.explanation && e.explanation.includes(q)))
      );
    }

    return list;
  }, [rules, selectedCategory, searchTerm]);

  // Handlers for Rule Edit/Add
  const handleOpenAddRule = () => {
    setEditingRule(null);
    setFormTitle('');
    setFormCategory(selectedCategory !== 'all' ? selectedCategory : 'sakinan');
    setFormCategoryLabel('');
    setFormUnitTitle('');
    setFormCondition('');
    setFormRuling('');
    setFormMechanism('');
    setFormImportantNote('');
    setFormEvidenceMatn('');
    setFormTags('');
    setFormExamples([{ quranText: '', surahInfo: '', explanation: '' }]);
    setFormError('');
    setShowRuleModal(true);
  };

  const handleOpenEditRule = (rule: TajweedRuleItem) => {
    setEditingRule(rule);
    setFormTitle(rule.title);
    setFormCategory(rule.category || 'sakinan');
    setFormCategoryLabel(rule.categoryLabel || '');
    setFormUnitTitle(rule.unitTitle || '');
    setFormCondition(rule.condition || '');
    setFormRuling(rule.ruling || '');
    setFormMechanism(rule.mechanism || '');
    setFormImportantNote(rule.importantNote || '');
    setFormEvidenceMatn(rule.evidenceMatn || '');
    setFormTags((rule.tags || []).join(', '));
    setFormExamples(
      rule.examples && rule.examples.length > 0
        ? [...rule.examples]
        : [{ quranText: '', surahInfo: '', explanation: '' }]
    );
    setFormError('');
    setShowRuleModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('يرجى إدخال عنوان الحكم التجويدي');
      return;
    }
    if (!formCondition.trim()) {
      setFormError('يرجى إدخال ضابط أو شرط الحكم');
      return;
    }
    if (!formRuling.trim()) {
      setFormError('يرجى إدخال الحكم الصوتي وطريقة التطبيق');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      // Find category label
      const catObj = categories.find((c) => c.id === formCategory);
      const catLabel = catObj ? catObj.label : (formCategoryLabel || 'أحكام التجويد');

      const cleanExamples = formExamples.filter((ex) => ex.quranText.trim().length > 0);
      const cleanTags = formTags
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const ruleToSave: TajweedRuleItem = {
        id: editingRule ? editingRule.id : `rule_${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        categoryLabel: catLabel,
        courseId: catObj?.courseId || formCategory,
        unitTitle: formUnitTitle.trim() || undefined,
        unitId: catObj?.unitId || undefined,
        condition: formCondition.trim(),
        ruling: formRuling.trim(),
        mechanism: formMechanism.trim() || formRuling.trim(),
        importantNote: formImportantNote.trim() || undefined,
        evidenceMatn: formEvidenceMatn.trim() || undefined,
        tags: cleanTags.length > 0 ? cleanTags : [formTitle.trim()],
        examples: cleanExamples.length > 0 ? cleanExamples : [{ quranText: 'مثال قرآني' }],
        updatedAt: Date.now(),
      };

      const result = await saveCheatSheetRule(ruleToSave);
      if (!result.success) {
        setFormError(result.error || 'فشل حفظ الحكم التجويدي');
        setIsSaving(false);
        return;
      }

      setShowRuleModal(false);
      setEditingRule(null);
      setSaveStatusMsg(editingRule ? 'تم تحديث الحكم بنجاح في المطوية والسحاب ✅' : 'تمت إضافة الحكم بنجاح إلى المطوية والسحاب ✅');
      setTimeout(() => setSaveStatusMsg(''), 4000);
    } catch (err: any) {
      setFormError('حدث خطأ: ' + (err?.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteCheatSheetRule(ruleId);
      setDeleteConfirmId(null);
      setSaveStatusMsg('تم حذف الحكم من المطوية بنجاح ✅');
      setTimeout(() => setSaveStatusMsg(''), 4000);
    } catch (e: any) {
      alert('فشل الحذف: ' + (e?.message || ''));
    }
  };

  const handleResetDefaults = async () => {
    try {
      await resetCheatSheetRulesToDefault();
      setResetConfirmOpen(false);
      setSaveStatusMsg('تمت استعادة الأحكام التجويدية الافتراضية بنجاح ✅');
      setTimeout(() => setSaveStatusMsg(''), 4000);
    } catch (e: any) {
      alert('فشل الاستعادة: ' + (e?.message || ''));
    }
  };

  const handleCopyExample = async (rule: TajweedRuleItem, text: string) => {
    try {
      const formatted = `📖 حكم تجويدي: ${rule.title}\nالقاعدة: ${rule.condition}\nالمثال القرآني: ﴿${text}﴾\nالضابط: ${rule.ruling}\nمنصة الحقائب التجويدية المعتمدة.`;
      await navigator.clipboard.writeText(formatted);
      setCopiedId(rule.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(rule.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const content = (
    <div className="space-y-6 font-tajawal dir-rtl text-slate-800">
      
      {/* Top Floating Exit Bar for Easy One-Click Close */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold font-quran text-xs sm:text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
              title="الرجوع إلى الدروس والأبواب أو إغلاق المطوية (مفتاح Esc)"
            >
              <ArrowRight className="w-4 h-4" />
              <span>خروج من المطوية (Esc)</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-quran">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>مطوية أحكام التجويد السريعة ومحرر الضوابط</span>
          </div>
        </div>

        {/* Edit Mode Toggle & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditModeEnabled(!isEditModeEnabled)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-1.5 cursor-pointer border ${
              isEditModeEnabled
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="تفعيل وضع تعديل وإضافة الأحكام التجويدية في المطوية"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditModeEnabled ? 'إغلاق وضع التعديل ✍️' : 'فتح وضع تعديل المطوية ✍️'}</span>
          </button>

          {isEditModeEnabled && (
            <>
              <button
                onClick={handleOpenAddRule}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-quran px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حكم جديد +</span>
              </button>

              <button
                onClick={() => setResetConfirmOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold font-quran px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                title="استعادة الأحكام الافتراضية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الافتراضي</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveStatusMsg && (
        <div className="p-3.5 bg-emerald-900/90 text-emerald-100 border-2 border-emerald-400 rounded-2xl text-xs sm:text-sm font-bold font-quran flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveStatusMsg}</span>
          </div>
          <button onClick={() => setSaveStatusMsg('')} className="p-1 text-emerald-300 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Title Section */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-900 rounded-3xl p-6 text-white border border-emerald-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold font-quran">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>دليل المراجعة السريعة والمطويّة التجويدية المعتمدة</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-quran text-amber-100 tracking-wide">
              مطوية أحكام التجويد السريعة (Rules Cheat Sheet)
            </h1>

            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
              مرجع تفاعلي مركز ومحقق للبحث الفوري عن قواعد التجويد، والشروط والضوابط الدقيقة، ومواضع الرسم العثماني، مع الأمثلة والشواهد لجميع الحقائب والأبواب التعليمية.
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="bg-slate-800/80 hover:bg-rose-600/90 text-slate-300 hover:text-white p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 border border-slate-700/60 flex items-center gap-1.5"
              title="خروج من المطوية (Esc)"
            >
              <X className="w-5 h-5" />
              <span className="text-xs font-quran hidden sm:inline">إغلاق</span>
            </button>
          )}
        </div>

        {/* Search & Fast Filter Input */}
        <div className="mt-5 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-amber-400 absolute right-4 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن أي حكم، أو حرف، أو كلمة قرآنية، أو ضابط تجويدي (مثال: كسر عارض، قطب جد، همزة وصل، إخفاء...)"
              className="w-full bg-slate-900/95 text-white pr-12 pl-12 py-3.5 rounded-2xl border-2 border-emerald-600/70 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm shadow-inner placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs / Filters (Dynamic: includes all added courses and units!) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 font-quran">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>تصفية الأحكام حسب الأبواب والحقائب التجويدية:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">
              عدد الأحكام المعروضة: <strong className="text-emerald-800 font-sans">{filteredRules.length}</strong> حكم
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-quran whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-md scale-102 font-extrabold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {cat.isCustom && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      {filteredRules.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-300 space-y-4">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 mx-auto text-xl">
            🔍
          </div>
          <h3 className="font-bold font-quran text-slate-800 text-base">
            لم يتم العثور على أي حكم مطابق لعبارة البحث "{searchTerm}" في هذا الباب
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            يمكنك استعراض كافة الأحكام، أو إضافة حكم جديد لهذا الباب مباشرة عبر زر "إضافة حكم جديد +" في الأعلى.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer font-quran"
            >
              استعراض كافة الأحكام
            </button>
            <button
              onClick={handleOpenAddRule}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer font-quran"
            >
              إضافة حكم لهذا الباب +
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => {
            const isExpanded = expandedRuleId === rule.id;
            return (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Category Chip & Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full font-quran inline-flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-emerald-600" />
                        <span>{rule.categoryLabel || 'أحكام التجويد'}</span>
                      </span>
                      {rule.unitTitle && (
                        <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-full font-quran truncate max-w-[180px]">
                          {rule.unitTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditModeEnabled && (
                        <>
                          <button
                            onClick={() => handleOpenEditRule(rule)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="تعديل هذا الحكم التجويدي"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(rule.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف هذا الحكم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleCopyExample(rule, rule.examples[0]?.quranText || rule.title)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="نسخ ملخص القاعدة والشاهد القرآني"
                      >
                        {copiedId === rule.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold font-quran text-slate-900 flex items-center gap-2">
                    <span>{rule.title}</span>
                  </h3>

                  {/* Condition (ضابط الحكم) */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs leading-relaxed space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block font-quran">
                      📌 ضابط وشروط القاعدة:
                    </span>
                    <p className="text-slate-600">{rule.condition}</p>
                  </div>

                  {/* Ruling & Mechanism (الحكم الصوتي) */}
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs leading-relaxed space-y-1">
                    <span className="text-[11px] font-bold text-emerald-900 block font-quran flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>الحكم الصوتي وطريقة التطبيق:</span>
                    </span>
                    <p className="text-emerald-950 font-bold">{rule.ruling}</p>
                  </div>

                  {/* Quranic Examples */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block font-quran">
                      📖 الشواهد والأمثلة القرآنية:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {rule.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-amber-100/70 transition-colors"
                        >
                          <span className="font-quran font-bold text-amber-950 text-sm">
                            ﴿{ex.quranText}﴾
                          </span>
                          {ex.surahInfo && (
                            <span className="text-[10px] text-amber-800 bg-amber-200/50 px-1.5 py-0.5 rounded font-tajawal">
                              {ex.surahInfo}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Details: Evidence Matn & Important Notes */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn text-xs">
                      {rule.importantNote && (
                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1">
                          <span className="font-bold text-amber-900 flex items-center gap-1 font-quran">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>تنبيه وضابط دقيق:</span>
                          </span>
                          <p className="text-amber-950 text-[11px] leading-relaxed">
                            {rule.importantNote}
                          </p>
                        </div>
                      )}

                      {rule.evidenceMatn && (
                        <div className="bg-slate-900 text-amber-200 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 font-quran block">
                            📜 الشاهد المنظوم (الجزرية أو تحفة الأطفال):
                          </span>
                          <p className="font-quran text-xs text-amber-100 leading-loose text-center">
                            «{rule.evidenceMatn}»
                          </p>
                        </div>
                      )}

                      {/* Detailed Example Explanations */}
                      {rule.examples.some((e) => e.explanation) && (
                        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-700 font-quran block">
                            توجيه الأمثلة والشواهد:
                          </span>
                          {rule.examples.map((ex, i) => ex.explanation ? (
                            <div key={i} className="text-[11px] text-slate-600 flex items-baseline gap-1">
                              <span className="font-quran font-bold text-emerald-800">﴿{ex.quranText}﴾:</span>
                              <span>{ex.explanation}</span>
                            </div>
                          ) : null)}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {rule.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-tajawal">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Toggle */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                    className="text-emerald-800 hover:text-emerald-950 font-bold font-quran flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>إخفاء التفاصيل والشاهد</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>عرض التنبيهات والشاهد المنظوم ({rule.examples.length} أمثلة)</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-400 font-quran">
                    طريقة النطق: {rule.mechanism.slice(0, 24)}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border-2 border-rose-300 shadow-2xl space-y-4 text-center font-tajawal">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-quran text-slate-900 text-base">
              تأكيد حذف الحكم التجويدي
            </h3>
            <p className="text-xs text-slate-600">
              هل أنت متأكد من رغبتك في حذف هذا الحكم من المطوية؟ لا يمكن التراجع عن هذه الخطوة إلا باستعادة الافتراضي.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleDeleteRule(deleteConfirmId)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold font-quran py-2.5 rounded-xl text-xs cursor-pointer"
              >
                نعم، احذف الحكم
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-quran py-2.5 rounded-xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border-2 border-amber-300 shadow-2xl space-y-4 text-center font-tajawal">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-quran text-slate-900 text-base">
              استعادة الأحكام الافتراضية للمطوية
            </h3>
            <p className="text-xs text-slate-600">
              سيتم إعادة ضبط المطوية لجميع أحكام التجويد المحققة الافتراضية مع حذف أي أحكام معدلة أو مضافة يدوياً.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleResetDefaults}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-quran py-2.5 rounded-xl text-xs cursor-pointer"
              >
                نعم، استعد الافتراضي
              </button>
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-quran py-2.5 rounded-xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn font-tajawal">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border-2 border-emerald-600 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold font-quran text-slate-900 text-base sm:text-lg">
                  {editingRule ? 'تعديل الحكم التجويدي في المطوية' : 'إضافة حكم تجويدي جديد إلى المطوية'}
                </h3>
              </div>
              <button
                onClick={() => setShowRuleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 font-quran block">
                    عنوان الحكم التجويدي *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثال: الإدغام الصغير، القلقلة الكبرى..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-tajawal"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 font-quran block">
                    الحقيبة / الباب التابع له الحكم *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-tajawal bg-white"
                  >
                    {categories.filter((c) => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Unit Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 font-quran block">
                  اسم الباب التجويدي (اختياري)
                </label>
                <input
                  type="text"
                  value={formUnitTitle}
                  onChange={(e) => setFormUnitTitle(e.target.value)}
                  placeholder="مثال: الباب الثالث: التقاء الساكنين في كلمتين"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-xs font-tajawal"
                />
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 font-quran block">
                  ضابط وشروط القاعدة التجويدية *
                </label>
                <textarea
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  rows={2}
                  placeholder="إذا التقى ساكنان بين كلمتين، وكان الأول حرفاً صحيحاً..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-xs font-tajawal leading-relaxed"
                  required
                />
              </div>

              {/* Ruling & Mechanism */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 font-quran block">
                    الحكم الصوتي *
                  </label>
                  <input
                    type="text"
                    value={formRuling}
                    onChange={(e) => setFormRuling(e.target.value)}
                    placeholder="تحريك الساكن الأول بالكسر العارض وصلاً"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-xs font-tajawal"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 font-quran block">
                    كيفية النطق والتطبيق
                  </label>
                  <input
                    type="text"
                    value={formMechanism}
                    onChange={(e) => setFormMechanism(e.target.value)}
                    placeholder="يُنطق الحرف الأول مكسوراً دون مد وتسقط همزة الوصل"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-xs font-tajawal"
                  />
                </div>
              </div>

              {/* Quranic Examples */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 font-quran">
                    📖 الشواهد والأمثلة القرآنية
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormExamples([...formExamples, { quranText: '', surahInfo: '', explanation: '' }])}
                    className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold font-quran flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مثال آخر +</span>
                  </button>
                </div>

                {formExamples.map((ex, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={ex.quranText}
                      onChange={(e) => {
                        const next = [...formExamples];
                        next[idx].quranText = e.target.value;
                        setFormExamples(next);
                      }}
                      placeholder="الكلمة / الآية: قُلِ ادْعُوا اللَّهَ"
                      className="p-2 rounded-lg border border-slate-200 text-xs font-quran font-bold"
                    />
                    <input
                      type="text"
                      value={ex.surahInfo || ''}
                      onChange={(e) => {
                        const next = [...formExamples];
                        next[idx].surahInfo = e.target.value;
                        setFormExamples(next);
                      }}
                      placeholder="السورة ورقم الآية: الإسراء: 110"
                      className="p-2 rounded-lg border border-slate-200 text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={ex.explanation || ''}
                        onChange={(e) => {
                          const next = [...formExamples];
                          next[idx].explanation = e.target.value;
                          setFormExamples(next);
                        }}
                        placeholder="بيان الشاهد: كسر اللام"
                        className="p-2 rounded-lg border border-slate-200 text-xs flex-1"
                      />
                      {formExamples.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormExamples(formExamples.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Important Note & Matn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 font-quran block">
                    تنبيه وضابط دقيق (اختياري)
                  </label>
                  <textarea
                    value={formImportantNote}
                    onChange={(e) => setFormImportantNote(e.target.value)}
                    rows={2}
                    placeholder="استثناءات، أو تنبيه على خطأ شائع عند القراءة..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-tajawal leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 font-quran block">
                    الشاهد المنظوم (الجزرية / التحفة)
                  </label>
                  <textarea
                    value={formEvidenceMatn}
                    onChange={(e) => setFormEvidenceMatn(e.target.value)}
                    rows={2}
                    placeholder="وَإِنْ تَلَاقَى سَاكِنَانِ فَاحْذِفَا..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-quran leading-relaxed"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 font-quran block">
                  وسوم البحث (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="كسر عارض, تنوين, همزة وصل, التقاء الساكنين"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-tajawal"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-quran transition-colors cursor-pointer text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-quran shadow-md transition-all cursor-pointer disabled:opacity-50 text-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ الحكم في المطوية'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );

  if (mode === 'embedded') {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-tajawal dir-rtl no-print animate-fadeIn"
    >
      <div className="bg-slate-50 border border-emerald-700/60 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl overflow-hidden my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        {content}
      </div>
    </div>
  );
};
