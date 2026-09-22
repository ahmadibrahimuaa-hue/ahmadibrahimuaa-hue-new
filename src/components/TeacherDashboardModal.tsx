import React, { useState, useEffect } from 'react';
import { 
  UserCheck, ShieldCheck, Award, Trash2, Download, Search, X, 
  CheckCircle2, AlertCircle, FileSpreadsheet, Lock, RefreshCw, Eye, Loader2, Wifi,
  PlusCircle, Edit3, HelpCircle, BookOpen, Layers, Check, RotateCcw, AlertTriangle,
  Upload, Image as ImageIcon, Palette, Users, Key, Copy, Shield, ExternalLink, Briefcase, BarChart3, FileText
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { StudentSubmission, ComprehensiveExamQuestion, TrainerAccount } from '../types';
import { getStudentSubmissionsAsync, clearAllSubmissions, getStudentProfile } from '../utils/studentStorage';
import { 
  getUnitQuizQuestions, 
  getComprehensiveExamBank, 
  saveUnitQuizQuestion, 
  deleteUnitQuizQuestion, 
  saveComprehensiveExamQuestion, 
  deleteComprehensiveExamQuestion,
  resetQuestionsToDefault,
  subscribeQuestionBank,
  UnitQuizQuestion 
} from '../utils/questionStorage';
import { 
  getCertificateConfig, 
  saveCertificateConfig, 
  subscribeCertificateConfig, 
  DEFAULT_CERTIFICATE_CONFIG, 
  CertificateConfig,
  CourseCertSettings,
  getCourseCertSettings,
  updateCourseCertSettingsInConfig,
  compressImageDataUrl
} from '../utils/certificateConfigStorage';
import { getAllCourses, getCourseById } from '../data/courses';
import { CertificateTemplateView } from './CertificateTemplateView';
import { AdminTrainersPanel } from './AdminTrainersPanel';
import { BagManagementPanel } from './BagManagementPanel';
import { TeacherWaitlistPanel } from './TeacherWaitlistPanel';
import { TeacherAnalyticsDashboard } from './TeacherAnalyticsDashboard';
import { TeacherGuidePanel } from './TeacherGuidePanel';
import { StudentAccessManagementPanel } from './StudentAccessManagementPanel';
import { InstituteThemeCustomizerPanel } from './InstituteThemeCustomizerPanel';
import { ExamDifficultyLevel } from '../types';
import { getActiveTrainersList } from '../utils/trainerStorage';
import { subscribeWaitlistEntries, WaitlistEntry } from '../utils/waitlistStorage';

interface TeacherDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockTeacherMode: () => void;
  initialTab?: 'analytics' | 'submissions' | 'teacher_guide' | 'unit_questions' | 'exam_questions' | 'certificate' | 'trainers' | 'bag_management' | 'waitlist' | 'students_access' | 'institute_themes';
  activeCourseId?: string;
  authTrainer?: TrainerAccount | null;
  authRole?: 'super_admin' | 'trainer';
}

const SAKINAN_UNIT_TITLES: Record<number, string> = {
  1: 'الباب الأول: المدخل إلى التقاء الساكنين',
  2: 'الباب الثاني: التقاء الساكنين في كلمة واحدة',
  3: 'الباب الثالث: التقاء الساكنين في كلمتين (المتحرك بالكسر)',
  4: 'الباب الرابع: التقاء الساكنين في كلمتين (المتحرك بالفتح والضم)',
  5: 'الباب الخامس: الحذف والوقف والعارض',
  6: 'الباب السادس: الاستثناءات والكلمات الخلافية',
};

const IDGHAM_UNIT_TITLES: Record<number, string> = {
  1: 'الباب الأول: إدغام المتماثلين (المثلين) وأقسامه واستثناءاته',
  2: 'الباب الثاني: إدغام المتجانسين الصغير وأقسامه واستثناءاته',
  3: 'الباب الثالث: إدغام المتقاربين الصغير ومواضع حفص الخمسة',
  4: 'الباب الرابع: الإدغام الكبير والمطلق ومذهب حفص فيهما',
  5: 'الباب الخامس: علامات ضبط الإدغام في رسم المصحف وتوجيهه',
};

export const TeacherDashboardModal: React.FC<TeacherDashboardModalProps> = ({
  isOpen,
  onClose,
  onLockTeacherMode,
  initialTab = 'submissions',
  activeCourseId = 'sakinan',
  authTrainer = null,
  authRole = 'trainer',
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'submissions' | 'teacher_guide' | 'unit_questions' | 'exam_questions' | 'certificate' | 'trainers' | 'bag_management' | 'waitlist' | 'students_access' | 'institute_themes'>(
    initialTab
  );

  // Waitlist Pending Counter
  const [pendingWaitlistCount, setPendingWaitlistCount] = useState<number>(0);
  const [waitlistTotalCount, setWaitlistTotalCount] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeWaitlistEntries((entries) => {
      const pending = entries.filter((e) => e.status === 'pending').length;
      setPendingWaitlistCount(pending);
      setWaitlistTotalCount(entries.length);
    });
    return () => unsub();
  }, []);

  // Selected Course within Teacher Dashboard
  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourseId || 'sakinan');

  // Trainer filter for Submissions (for super admin or switching view)
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [copiedTrainerLink, setCopiedTrainerLink] = useState<boolean>(false);

  // Certificate Config State
  const [certConfig, setCertConfig] = useState<CertificateConfig>(getCertificateConfig());
  const [certSavedSuccess, setCertSavedSuccess] = useState<boolean>(false);
  const [certSavedError, setCertSavedError] = useState<string>('');
  const [savingCert, setSavingCert] = useState<boolean>(false);
  const [certCourseTab, setCertCourseTab] = useState<string>(activeCourseId || 'sakinan');
  const [certPreviewPercentage, setCertPreviewPercentage] = useState<number>(95);

  useEffect(() => {
    const unsub = subscribeCertificateConfig((cfg) => {
      setCertConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Update selected tab and course when initialTab or activeCourseId changes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourseId(activeCourseId);
      setCertCourseTab(activeCourseId);
    }
  }, [activeCourseId, isOpen]);

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetCourseId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, JPEG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const compressed = await compressImageDataUrl(dataUrl, 1600, 0.85);
        setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, targetCourseId, { bgTemplateUrl: compressed }));
      } catch (err) {
        console.error('Image compression error:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCertConfig = async () => {
    setSavingCert(true);
    setCertSavedError('');
    try {
      const res = await saveCertificateConfig(certConfig);
      setCertConfig(res);
      setCertSavedSuccess(true);
      setTimeout(() => setCertSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save certificate config:', err);
      setCertSavedError('حدث خطأ أثناء الحفظ في السحاب: ' + (err?.message || 'يرجى التأكد من اتصال الاتصال بالإنترنت'));
    } finally {
      setSavingCert(false);
    }
  };

  const handleResetCourseCertConfig = (targetCourseId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط إعدادات ومواضع قالَب شهادة هذه الحقيبة إلى القيم الافتراضية؟')) {
      setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, targetCourseId, {
        bgTemplateUrl: '/certificate_template.jpg',
        studentNameTopPct: 33.8,
        studentNameRightPct: 26,
        studentNameScalePct: 100,
        studentNameColor: '#0f172a',
        scoreTopPct: 56.8,
        scoreRightPct: 38.0,
        scoreScalePct: 100,
        scoreColor: '#0f172a',
      }));
    }
  };

  const handleResetCertConfig = async () => {
    if (window.confirm('هل أنت متأكد من إعادة ضبط كافة إعدادات الشهادات لجميع الحقائب إلى القيم الافتراضية؟')) {
      setSavingCert(true);
      setCertSavedError('');
      try {
        const res = await saveCertificateConfig(DEFAULT_CERTIFICATE_CONFIG);
        setCertConfig(res);
        setCertSavedSuccess(true);
        setTimeout(() => setCertSavedSuccess(false), 4000);
      } catch (err: any) {
        setCertSavedError('فشل إعادة الضبط: ' + (err?.message || 'حاول مرة أخرى'));
      } finally {
        setSavingCert(false);
      }
    }
  };

  // Submissions State
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeStudentProfile, setActiveStudentProfile] = useState<{ name: string; registeredAt: string } | null>(null);

  // Questions State
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number>(1);
  const [unitQuestions, setUnitQuestions] = useState<UnitQuizQuestion[]>([]);
  const [comprehensiveQuestions, setComprehensiveQuestions] = useState<ComprehensiveExamQuestion[]>([]);
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');

  // Modals for Edit/Add
  const [editingUnitQ, setEditingUnitQ] = useState<UnitQuizQuestion | null>(null);
  const [isAddingUnitQ, setIsAddingUnitQ] = useState<boolean>(false);

  const [editingExamQ, setEditingExamQ] = useState<ComprehensiveExamQuestion | null>(null);
  const [isAddingExamQ, setIsAddingExamQ] = useState<boolean>(false);

  // Form states for Unit Question
  const [unitQText, setUnitQText] = useState<string>('');
  const [unitQOpt0, setUnitQOpt0] = useState<string>('');
  const [unitQOpt1, setUnitQOpt1] = useState<string>('');
  const [unitQOpt2, setUnitQOpt2] = useState<string>('');
  const [unitQOpt3, setUnitQOpt3] = useState<string>('');
  const [unitQCorrectIdx, setUnitQCorrectIdx] = useState<number>(0);
  const [unitQExplanation, setUnitQExplanation] = useState<string>('');

  // Form states for Comprehensive Exam Question
  const [examQUnitNum, setExamQUnitNum] = useState<number>(1);
  const [examQType, setExamQType] = useState<'mcq' | 'analysis' | 'correction'>('mcq');
  const [examQText, setExamQText] = useState<string>('');
  const [examQContext, setExamQContext] = useState<string>('');
  const [examQOpt0, setExamQOpt0] = useState<string>('');
  const [examQOpt1, setExamQOpt1] = useState<string>('');
  const [examQOpt2, setExamQOpt2] = useState<string>('');
  const [examQOpt3, setExamQOpt3] = useState<string>('');
  const [examQCorrectAnswer, setExamQCorrectAnswer] = useState<string>('');
  const [examQExplanation, setExamQExplanation] = useState<string>('');
  const [examQPoints, setExamQPoints] = useState<number>(5);
  const [examQLevel, setExamQLevel] = useState<ExamDifficultyLevel>('intermediate');
  const [examQLevelFilter, setExamQLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const isIdgham = selectedCourseId === 'idgham';
  const unitTitlesMap = isIdgham ? IDGHAM_UNIT_TITLES : SAKINAN_UNIT_TITLES;
  const availableUnitNumbers = isIdgham ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];

  const fetchSubmissions = async () => {
    setLoading(true);
    const data = await getStudentSubmissionsAsync();
    setSubmissions(data);
    setLoading(false);
  };

  const loadQuestionData = () => {
    setUnitQuestions(getUnitQuizQuestions(selectedUnitNumber, selectedCourseId));
    setComprehensiveQuestions(getComprehensiveExamBank(selectedCourseId));
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setActiveStudentProfile(getStudentProfile());

      // Real-time Firestore submissions subscription
      const colRef = collection(db, 'submissions');
      const unsubscribeSub = onSnapshot(
        colRef,
        (snapshot) => {
          const list: StudentSubmission[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              studentName: data.studentName || 'طالب جديد',
              unitTitle: data.unitTitle || '',
              testType: data.testType || '',
              score: Number(data.score) || 0,
              totalQuestions: Number(data.totalQuestions) || 1,
              percentage: Number(data.percentage) || 0,
              date: data.date || '',
              timestamp: Number(data.timestamp) || 0,
              details: data.details || '',
            });
          });
          list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setSubmissions(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Realtime subscription error:', err);
          fetchSubmissions();
        }
      );

      // Question Storage subscription
      loadQuestionData();
      const unsubscribeQuestions = subscribeQuestionBank(() => {
        loadQuestionData();
      });

      return () => {
        unsubscribeSub();
        unsubscribeQuestions();
      };
    }
  }, [isOpen, selectedUnitNumber, selectedCourseId]);

  useEffect(() => {
    if (isOpen) {
      setUnitQuestions(getUnitQuizQuestions(selectedUnitNumber, selectedCourseId));
      setComprehensiveQuestions(getComprehensiveExamBank(selectedCourseId));
    }
  }, [selectedUnitNumber, selectedCourseId, isOpen]);

  // Make sure selectedUnitNumber is valid for current course
  useEffect(() => {
    if (isIdgham && selectedUnitNumber > 5) {
      setSelectedUnitNumber(1);
    }
  }, [selectedCourseId]);

  if (!isOpen) return null;

  // --- UNIT QUESTION HANDLERS ---
  const handleOpenAddUnitQ = () => {
    setEditingUnitQ(null);
    setUnitQText('');
    setUnitQOpt0('');
    setUnitQOpt1('');
    setUnitQOpt2('');
    setUnitQOpt3('');
    setUnitQCorrectIdx(0);
    setUnitQExplanation('');
    setIsAddingUnitQ(true);
  };

  const handleOpenEditUnitQ = (q: UnitQuizQuestion) => {
    setEditingUnitQ(q);
    setUnitQText(q.question);
    setUnitQOpt0(q.options[0] || '');
    setUnitQOpt1(q.options[1] || '');
    setUnitQOpt2(q.options[2] || '');
    setUnitQOpt3(q.options[3] || '');
    setUnitQCorrectIdx(q.correctIndex || 0);
    setUnitQExplanation(q.explanation || '');
    setIsAddingUnitQ(true);
  };

  const handleSaveUnitQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitQText.trim()) {
      alert('يرجى كتابة نص السؤال.');
      return;
    }

    const options = [unitQOpt0.trim(), unitQOpt1.trim(), unitQOpt2.trim(), unitQOpt3.trim()].filter(Boolean);
    if (options.length < 2) {
      alert('يرجى إدخال خيارين على الأقل للسؤال.');
      return;
    }

    const questionObj: UnitQuizQuestion = {
      id: editingUnitQ ? editingUnitQ.id : Date.now(),
      question: unitQText.trim(),
      options,
      correctIndex: Math.min(unitQCorrectIdx, options.length - 1),
      explanation: unitQExplanation.trim(),
    };

    await saveUnitQuizQuestion(selectedUnitNumber, questionObj, selectedCourseId);
    setIsAddingUnitQ(false);
    setEditingUnitQ(null);
  };

  const handleDeleteUnitQ = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السؤال من اختبار الباب؟ سيتم التحديث في واجهة الطلاب فوراً.')) {
      await deleteUnitQuizQuestion(selectedUnitNumber, id, selectedCourseId);
    }
  };

  // --- COMPREHENSIVE EXAM QUESTION HANDLERS ---
  const handleOpenAddExamQ = () => {
    setEditingExamQ(null);
    setExamQUnitNum(selectedUnitNumber || 1);
    setExamQType('mcq');
    setExamQText('');
    setExamQContext('');
    setExamQOpt0('');
    setExamQOpt1('');
    setExamQOpt2('');
    setExamQOpt3('');
    setExamQCorrectAnswer('');
    setExamQExplanation('');
    setExamQPoints(5);
    setExamQLevel('intermediate');
    setIsAddingExamQ(true);
  };

  const handleOpenEditExamQ = (q: ComprehensiveExamQuestion) => {
    setEditingExamQ(q);
    setExamQUnitNum(q.unitNumber || 1);
    setExamQType(q.type || 'mcq');
    setExamQText(q.question);
    setExamQContext(q.contextText || '');
    const opts = q.options || [];
    setExamQOpt0(opts[0] || '');
    setExamQOpt1(opts[1] || '');
    setExamQOpt2(opts[2] || '');
    setExamQOpt3(opts[3] || '');
    setExamQCorrectAnswer(q.correctAnswer || '');
    setExamQExplanation(q.explanation || '');
    setExamQPoints(q.points || 5);
    setExamQLevel(q.level || 'intermediate');
    setIsAddingExamQ(true);
  };

  const handleSaveExamQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examQText.trim()) {
      alert('يرجى كتابة نص السؤال.');
      return;
    }

    const options = [examQOpt0.trim(), examQOpt1.trim(), examQOpt2.trim(), examQOpt3.trim()].filter(Boolean);
    let finalCorrectAnswer = examQCorrectAnswer.trim();
    if (!finalCorrectAnswer && options.length > 0) {
      finalCorrectAnswer = options[0];
    }

    const questionObj: ComprehensiveExamQuestion = {
      id: editingExamQ ? editingExamQ.id : Date.now(),
      unitNumber: Number(examQUnitNum) || 1,
      type: examQType,
      question: examQText.trim(),
      contextText: examQContext.trim() || undefined,
      options: options.length > 0 ? options : undefined,
      correctAnswer: finalCorrectAnswer,
      explanation: examQExplanation.trim(),
      points: Number(examQPoints) || 5,
      level: examQLevel,
    };

    await saveComprehensiveExamQuestion(questionObj, selectedCourseId);
    setIsAddingExamQ(false);
    setEditingExamQ(null);
  };

  const handleDeleteExamQ = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السؤال من بنك الاختبار الشامل؟')) {
      await deleteComprehensiveExamQuestion(id, selectedCourseId);
    }
  };

  const handleResetDefaults = async () => {
    const courseLabel = isIdgham ? 'حقيبة أحكام الإدغام' : 'حقيبة التقاء الساكنين';
    if (window.confirm(`هل أنت متأكد من استعادة كافة الأسئلة الافتراضية الأصلية لـ (${courseLabel})؟ سيتم إلغاء التعديلات المخصصة.`)) {
      await resetQuestionsToDefault(selectedCourseId);
      alert(`تم استعادة بنك الأسئلة الافتراضي الأصلي لـ (${courseLabel}) بنجاح.`);
    }
  };

  // Filters for Submissions
  const filteredSubmissions = submissions.filter((s) => {
    const sTerm = (searchTerm || '').toLowerCase();
    return (
      (s.studentName || '').toLowerCase().includes(sTerm) ||
      (s.unitTitle || '').toLowerCase().includes(sTerm) ||
      (s.testType || '').toLowerCase().includes(sTerm)
    );
  });

  // Filters for Unit Questions
  const filteredUnitQs = unitQuestions.filter((q) => {
    const qTerm = (questionSearch || '').toLowerCase();
    return (
      (q.question || '').toLowerCase().includes(qTerm) ||
      (q.explanation || '').toLowerCase().includes(qTerm)
    );
  });

  // Filters for Comprehensive Questions
  const filteredExamQs = comprehensiveQuestions.filter((q) => {
    const qTerm = (questionSearch || '').toLowerCase();
    const matchesSearch =
      (q.question || '').toLowerCase().includes(qTerm) ||
      (q.contextText ? q.contextText.toLowerCase().includes(qTerm) : false) ||
      (q.explanation || '').toLowerCase().includes(qTerm);
    const matchesUnit = selectedUnitNumber === 0 || q.unitNumber === selectedUnitNumber;
    const matchesType = examTypeFilter === 'all' || q.type === examTypeFilter;
    const matchesLevel = examQLevelFilter === 'all' || q.level === examQLevelFilter;
    return matchesSearch && matchesUnit && matchesType && matchesLevel;
  });

  const handleExportText = () => {
    if (submissions.length === 0) {
      alert('لا توجد سجلات للطلاب حالياً لتصديرها.');
      return;
    }

    let report = `=== تقرير نتائج وتسجيلات الطلاب - منصة الحقائب التجويدية ===\n`;
    report += `الحقيبة المحددة: ${isIdgham ? 'أحكام الإدغام' : 'التقاء الساكنين'}\n`;
    report += `تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n\n`;

    filteredSubmissions.forEach((sub, i) => {
      report += `${i + 1}. الطالب: ${sub.studentName}\n`;
      report += `   الوحدة/الاختبار: ${sub.unitTitle} (${sub.testType})\n`;
      report += `   النتيجة: ${sub.score} من ${sub.totalQuestions} (${sub.percentage}%)\n`;
      report += `   التاريخ: ${sub.date}\n`;
      if (sub.details) report += `   التفاصيل: ${sub.details}\n`;
      report += `--------------------------------------------------\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_نتائج_الطلاب_${selectedCourseId}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col border-2 border-amber-400 shadow-2xl overflow-hidden font-tajawal text-right dir-rtl">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 text-white flex items-center justify-between border-b border-amber-400/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg font-extrabold">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-quran">
                  لوحة التحكم الخاصة بالمعلم والمدرب
                </span>
                <span className="bg-emerald-900/80 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30 font-quran">
                  {isIdgham ? 'حقيبة الإدغام' : 'حقيبة التقاء الساكنين'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-quran text-amber-100 mt-1">
                إدارة نتائج الطلاب وبنك الأسئلة التفاعلي
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLockTeacherMode}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="قفل نمط المعلم والعودة فوراً لنسخة الطالب"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">قفل النمط والعودة لنسخة الطالب</span>
              <span className="sm:hidden">قفل</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Course Switcher Bar inside Teacher Dashboard */}
        <div className="bg-slate-950 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 font-bold font-quran flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              اختر الحقيبة التدريبية المراد إدارتها:
            </span>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => {
                  setSelectedCourseId('sakinan');
                  setSelectedUnitNumber(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-quran transition-all cursor-pointer ${
                  selectedCourseId === 'sakinan'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. التقاء الساكنين
              </button>
              <button
                onClick={() => {
                  setSelectedCourseId('idgham');
                  setSelectedUnitNumber(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-quran transition-all cursor-pointer ${
                  selectedCourseId === 'idgham'
                    ? 'bg-indigo-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. أحكام الإدغام (المثلين، المتجانسين، المتقاربين)
              </button>
            </div>
          </div>

          <button
            onClick={handleResetDefaults}
            className="text-[11px] text-amber-300/80 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
            title="استعادة بنك الأسئلة الافتراضي الأصلي للحقيبة المحددة"
          >
            <RotateCcw className="w-3 h-3" />
            <span>استعادة البنك الافتراضي للحقيبة</span>
          </button>
        </div>

        {/* Main Tab Navigation Header */}
        <div className="bg-slate-900 px-5 pt-3 pb-0 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800 hover:text-white border border-amber-500/30'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>📊 لوحة الإحصائيات والتحليلات البيانية</span>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'submissions'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>سجل نتائج وتدريبات الطلاب ({submissions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('teacher_guide')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'teacher_guide'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>📖 دليل إجابات المعلم (المناقشة والواجبات والتلاوة)</span>
            </button>

            <button
              onClick={() => setActiveTab('unit_questions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'unit_questions'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>إدارة أسئلة أبواب الدروس ({isIdgham ? '5 أبواب' : '6 أبواب'})</span>
            </button>

            <button
              onClick={() => setActiveTab('exam_questions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'exam_questions'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>إدارة بنك الاختبار الشامل ({comprehensiveQuestions.length} سؤالاً)</span>
            </button>

            <button
              onClick={() => setActiveTab('certificate')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'certificate'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40'
              }`}
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span>🎓 تصميم الشهادات</span>
            </button>

            <button
              onClick={() => setActiveTab('bag_management')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'bag_management'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md ring-2 ring-emerald-300'
                  : 'bg-emerald-950/90 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/40'
              }`}
            >
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>🗂️ إدارة الحقائب والدروس والأسعار</span>
            </button>

            <button
              onClick={() => setActiveTab('institute_themes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'institute_themes'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                  : 'bg-purple-950/90 text-purple-300 hover:bg-purple-900 border border-purple-500/40'
              }`}
            >
              <Palette className="w-4 h-4 text-purple-300" />
              <span>🎨 تخصيص واجهات المعاهد والمجموعات</span>
            </button>

            <button
              onClick={() => setActiveTab('students_access')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'students_access'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                  : 'bg-indigo-950/90 text-indigo-300 hover:bg-indigo-900 border border-indigo-500/40'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>🔑 صلاحيات وقفل الحقائب للطلاب</span>
            </button>

            <button
              onClick={() => setActiveTab('waitlist')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'waitlist'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-800/90 text-amber-300 hover:bg-slate-800 hover:text-white border border-amber-500/40'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>📋 طلبات الانتظار والاشتراكات</span>
              {pendingWaitlistCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-mono px-2 py-0.5 rounded-full font-bold animate-pulse shadow">
                  {pendingWaitlistCount} جديد
                </span>
              )}
            </button>

            {authRole === 'super_admin' && (
              <button
                onClick={() => setActiveTab('trainers')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'trainers'
                    ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                    : 'bg-emerald-900/90 text-amber-300 hover:bg-emerald-800 hover:text-white border border-amber-400/40'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>👥 إدارة المعلمين وتراخيص المدربين 🔑</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content Views */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">

          {/* TAB 0: ANALYTICS & STATISTICAL DASHBOARD */}
          {activeTab === 'analytics' && (
            <TeacherAnalyticsDashboard
              activeCourseId={selectedCourseId}
            />
          )}

          {/* TAB 1: SUBMISSIONS LIST */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              
              {/* Trainer Quick Invite Link Banner */}
              {authTrainer && (
                <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 text-white p-4 rounded-2xl border border-amber-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold font-quran text-base shrink-0 shadow-sm">
                      {authTrainer.role === 'super_admin' ? <Shield className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-300 font-quran text-sm">{authTrainer.name}</span>
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold">
                          كود الطلاب: {authTrainer.referralCode}
                        </span>
                        {authRole === 'super_admin' && (
                          <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                            المشرف العام
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        شارك رابط الدعوة أدناه مع طلابك لتسجيلهم تلقائياً في فصولك ومتابعة تقدمهم وإصدار شهاداتهم:
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        const studentUrl = typeof window !== 'undefined'
                          ? `${window.location.origin}${window.location.pathname}?ref=${authTrainer.referralCode}`
                          : `?ref=${authTrainer.referralCode}`;
                        navigator.clipboard.writeText(studentUrl);
                        setCopiedTrainerLink(true);
                        setTimeout(() => setCopiedTrainerLink(false), 2500);
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs shrink-0 shadow"
                    >
                      {copiedTrainerLink ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTrainerLink ? 'تم نسخ رابط الطلاب بنجاح' : 'نسخ رابط الطلاب المباشر'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Toolbar with Filters */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="بحث باسم الطالب، الباب، أو المعلم..."
                      className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-tajawal"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
                  </div>

                  {/* Trainer Filter Select */}
                  <select
                    value={trainerFilter}
                    onChange={(e) => setTrainerFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-quran focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">-- كل الطلاب (جميع المعلمين) --</option>
                    {authTrainer && (
                      <option value={authTrainer.id}>📌 طلابي فقط ({authTrainer.name})</option>
                    )}
                    {getActiveTrainersList()
                      .filter((t) => t.id !== authTrainer?.id && t.role !== 'super_admin')
                      .map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          معلم: {tr.name} ({tr.referralCode})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={fetchSubmissions}
                    disabled={loading}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>تحديث ({filteredSubmissions.length})</span>
                  </button>

                  <button
                    onClick={handleExportText}
                    className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير التقرير (TXT)</span>
                  </button>

                  {submissions.length > 0 && (
                    <button
                      onClick={async () => {
                        if (window.confirm('هل أنت متأكد من مسح كافة سجلات ونتائج الطلاب المسجلة؟')) {
                          await clearAllSubmissions();
                          setSubmissions([]);
                        }
                      }}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح السجلات</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Student Registration Status */}
              {activeStudentProfile && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center font-quran text-base shadow-sm">
                      {activeStudentProfile.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 block">الطالب الحالي المسجل بالحساب:</span>
                      <h4 className="text-sm font-bold text-slate-900 font-quran">{activeStudentProfile.name}</h4>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-sans">{activeStudentProfile.registeredAt}</span>
                </div>
              )}

              {/* Submissions Table */}
              {filteredSubmissions.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-right text-xs text-slate-800">
                    <thead className="bg-slate-100 text-slate-900 font-bold font-quran border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">اسم الطالب</th>
                        <th className="p-3">المعلم المشرف</th>
                        <th className="p-3">اسم الاختبار / الوحدة</th>
                        <th className="p-3">نوع النشاط</th>
                        <th className="p-3">النتيجة والنسبة</th>
                        <th className="p-3">تاريخ الإنجاز</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-bold font-quran text-emerald-950 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            {item.studentName}
                          </td>
                          <td className="p-3">
                            {item.trainerName ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-lg text-[11px] font-quran">
                                {item.trainerName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">عام (المنصة)</span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-800">{item.unitTitle}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[11px]">
                              {item.testType}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-black font-quran px-2 py-0.5 rounded-lg text-xs ${
                                item.percentage >= 80 
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                  : item.percentage >= 50 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : 'bg-rose-100 text-rose-900 border border-rose-300'
                              }`}>
                                {item.score} / {item.totalQuestions} ({item.percentage}%)
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-500 font-sans text-[11px]">{item.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <Award className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold font-quran text-slate-700">لا توجد تسليكات أو نتائج مطابقة للبحث</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    عندما يجيب الطلاب على الاختبارات والتدريبات التفاعلية، ستظهر درجاتهم وتفاصيل حلولهم مصنفة حسب المعلم المشرف هنا.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UNIT QUIZZES EDITOR */}
          {activeTab === 'unit_questions' && (
            <div className="space-y-6">
              {/* Unit selector bar */}
              <div className={`${isIdgham ? 'bg-indigo-950 border-indigo-800' : 'bg-emerald-950 border-emerald-800'} text-white p-4 rounded-2xl space-y-3 shadow-md border`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-quran text-amber-300 text-sm font-bold">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>
                      اختر الباب العلمي في ({isIdgham ? 'حقيبة أحكام الإدغام' : 'حقيبة التقاء الساكنين'}) لإدارة أسئلته:
                    </span>
                  </div>
                  <button
                    onClick={handleOpenAddUnitQ}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>إضافة سؤال جديد لهذا الباب</span>
                  </button>
                </div>

                {/* Unit Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                  {availableUnitNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedUnitNumber(num)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                        selectedUnitNumber === num
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-md scale-[1.02]'
                          : isIdgham
                          ? 'bg-indigo-900/60 text-indigo-100 hover:bg-indigo-800 border-indigo-700/50'
                          : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800 border-emerald-700/50'
                      }`}
                    >
                      الباب {num}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-amber-200/90 font-tajawal pt-1 border-t border-white/10">
                  {unitTitlesMap[selectedUnitNumber]} (عدد الأسئلة الحالية: {unitQuestions.length})
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="البحث في صياغة أسئلة هذا الباب أو الشرح والتعليل..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-tajawal"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredUnitQs.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-emerald-300 transition-all">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-950 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm sm:text-base font-bold font-quran text-slate-900">
                            {q.question}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenEditUnitQ(q)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUnitQ(q.id)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-rose-300 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    {/* Options list preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border font-tajawal flex items-center justify-between ${
                            optIdx === q.correctIndex
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {optIdx === q.correctIndex && (
                            <span className="bg-emerald-800 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-quran">
                              الخيار الصحيح
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation preview */}
                    {q.explanation && (
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1 font-tajawal">
                        <span className="font-bold text-amber-900 font-quran">العلة والشرح:</span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}

                {filteredUnitQs.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold font-quran text-slate-600">لا توجد أسئلة مطابقة في هذا الباب</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPREHENSIVE EXAM BANK EDITOR */}
          {activeTab === 'exam_questions' && (
            <div className="space-y-6">
              {/* Exam Bank Header Toolbar */}
              <div className={`bg-gradient-to-r ${isIdgham ? 'from-indigo-950 via-slate-900 to-indigo-950 border-indigo-800' : 'from-emerald-950 via-slate-900 to-emerald-950 border-emerald-800'} text-white p-4 rounded-2xl space-y-3 shadow-md border`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-quran text-amber-300 text-sm font-bold">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>
                      بنك أسئلة (الاختبار النهائي الشامل) لـ ({isIdgham ? 'حقيبة أحكام الإدغام' : 'حقيبة التقاء الساكنين'}) - إجمالي: {comprehensiveQuestions.length} سؤالاً
                    </span>
                  </div>
                  <button
                    onClick={handleOpenAddExamQ}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>إضافة سؤال جديد للاختبار الشامل</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-amber-200 font-bold">تصفية حسب الباب:</span>
                    <select
                      value={selectedUnitNumber}
                      onChange={(e) => setSelectedUnitNumber(Number(e.target.value))}
                      className="bg-slate-800 text-amber-100 border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value={0}>جميع الأبواب (1 - {isIdgham ? '5' : '6'})</option>
                      {availableUnitNumbers.map((uNum) => (
                        <option key={uNum} value={uNum}>الباب {uNum}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-amber-200 font-bold">نوع السؤال:</span>
                    <select
                      value={examTypeFilter}
                      onChange={(e) => setExamTypeFilter(e.target.value)}
                      className="bg-slate-800 text-amber-100 border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="all">كافة الأنواع</option>
                      <option value="mcq">اختيار من متعدد</option>
                      <option value="analysis">تحليل وشواهد</option>
                      <option value="correction">تصويب خطأ أو لحن</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-amber-200 font-bold">المستوى:</span>
                    <select
                      value={examQLevelFilter}
                      onChange={(e) => setExamQLevelFilter(e.target.value as any)}
                      className="bg-slate-800 text-amber-100 border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 font-bold"
                    >
                      <option value="all">كافة المستويات</option>
                      <option value="beginner">🌿 المستوى المبتدئ</option>
                      <option value="intermediate">⚡ المستوى المتوسط</option>
                      <option value="advanced">👑 المستوى المتقدم</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="البحث في صياغة أسئلة الاختبار الشامل أو الآيات..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-tajawal"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredExamQs.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-emerald-300 transition-all">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-950 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md font-quran">
                              الباب {q.unitNumber}
                            </span>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {q.type === 'mcq' ? 'اختيار من متعدد' : q.type === 'analysis' ? 'تحليل وشواهد' : 'تصويب خطأ'}
                            </span>
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {q.points} درجات
                            </span>
                            {q.level === 'beginner' && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md font-quran">
                                🌿 مبتدئ
                              </span>
                            )}
                            {(!q.level || q.level === 'intermediate') && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md font-quran">
                                ⚡ متوسط
                              </span>
                            )}
                            {q.level === 'advanced' && (
                              <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md font-quran">
                                👑 متقدم
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-bold font-quran text-slate-900 mt-1">
                            {q.question}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenEditExamQ(q)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExamQ(q.id)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-rose-300 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    {/* Context Text / Ayah if present */}
                    {q.contextText && (
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 font-quran text-sm text-slate-900 text-center">
                        ﴿ {q.contextText} ﴾
                      </div>
                    )}

                    {/* Options Preview */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border font-tajawal flex items-center justify-between ${
                              opt === q.correctAnswer
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{opt}</span>
                            {opt === q.correctAnswer && (
                              <span className="bg-emerald-800 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-quran">
                                الإجابة الصحيحة
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1 font-tajawal">
                        <span className="font-bold text-amber-900 font-quran">العلة والشرح:</span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}

                {filteredExamQs.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold font-quran text-slate-600">لا توجد أسئلة مطابقة للبحث أو التصفية</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CERTIFICATE CUSTOMIZATION */}
          {activeTab === 'certificate' && (() => {
            const allCourses = getAllCourses();
            const currentCourseCert = getCourseCertSettings(certConfig, certCourseTab);
            const selectedCertCourse = allCourses.find((c) => c.id === certCourseTab) || allCourses[0];
            const hasCustomBg = Boolean(currentCourseCert.bgTemplateUrl && currentCourseCert.bgTemplateUrl !== '/certificate_template.jpg');

            return (
              <div className="space-y-6">
                {/* Course Selection Bar for Certificate */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3 shadow-md">
                  <div className="flex items-center gap-2 font-quran text-amber-300 text-sm font-bold">
                    <Palette className="w-5 h-5 text-amber-400" />
                    <span>تخصيص وتعديل قالَب شهادة الاجتياز للحقيبة:</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
                    {allCourses.map((course, idx) => {
                      const isSelected = certCourseTab === course.id;
                      return (
                        <button
                          key={course.id}
                          onClick={() => setCertCourseTab(course.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            isSelected
                              ? 'bg-emerald-700 text-white shadow-md border border-emerald-500'
                              : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
                          }`}
                        >
                          <span>{idx + 1}. {course.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Certificate Template Editor Studio */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                    <div>
                      <h3 className="font-bold font-quran text-lg text-slate-900 flex items-center gap-2">
                        <span>استوديو ضبط وتصميم الشهادة</span>
                        <span className="text-xs px-3 py-1 rounded-full font-quran font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {selectedCertCourse ? selectedCertCourse.title : 'الحقيبة المحددة'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-tajawal mt-1">
                        يمكنك تعديل صورة الخلفية للشهادة، وضبط مواضع وحجم ولون اسم الطالب والنسبة المئوية بدقة عالية مع المعاينة الفورية.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetCourseCertConfig(certCourseTab)}
                        disabled={savingCert}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="استعادة المواضع الافتراضية للشهادة لهذه الحقيبة"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>إعادة ضبط هذه الحقيبة</span>
                      </button>
                      <button
                        onClick={handleSaveCertConfig}
                        disabled={savingCert}
                        className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 font-quran"
                      >
                        {savingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                        <span>حفظ الإعدادات في السحاب فوراً</span>
                      </button>
                    </div>
                  </div>

                  {certSavedSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center gap-3 animate-fadeIn">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span className="font-bold">تم حفظ كافة إعدادات ومواضع الشهادة بنجاح في السحاب (Firestore) وستنعكس تلقائياً لدى جميع الطلاب!</span>
                    </div>
                  )}

                  {certSavedError && (
                    <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                      <span>{certSavedError}</span>
                    </div>
                  )}

                  {/* Section 1: Template Background Image Upload */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>صورة قالَب الشهادة الرسمية لـ ({selectedCertCourse?.title}):</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع صورة قالَب شهادة جديدة (JPG / PNG)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleBgImageUpload(e, certCourseTab)}
                            className="hidden"
                          />
                        </label>

                        {hasCustomBg && (
                          <button
                            onClick={() => {
                              setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { bgTemplateUrl: '/certificate_template.jpg' }));
                            }}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-300 transition-all cursor-pointer"
                          >
                            استعادة القالب الافتراضي
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ملاحظة: يمكنك رفع صورة شهادة مصممة مسبقاً بجودة عالية (A4 أفقي بدقة 297x210)، وسيقوم النظام بطباعة اسم الطالب ونسبته المئوية في المواضع المحددة أدناه.
                    </p>
                  </div>

                  {/* Section 2: Detailed Sliders & Controls for Coordinates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Card 1: Student Name Controls */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 text-xs font-tajawal">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold font-quran text-sm text-slate-900 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                          مواضع وتنسيق اسم الطالب/ة
                        </span>
                      </div>

                      {/* Vertical Position (Top %) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">الارتفاع الرأسي (Top % من الأعلى):</label>
                          <span className="text-emerald-800 font-sans font-black bg-emerald-100 px-2 py-0.5 rounded-md">
                            {currentCourseCert.studentNameTopPct ?? 33.8}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="85"
                          step="0.2"
                          value={currentCourseCert.studentNameTopPct ?? 33.8}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { studentNameTopPct: val }));
                          }}
                          className="w-full accent-emerald-700 cursor-pointer"
                        />
                      </div>

                      {/* Horizontal Position (Right %) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">الموضع الأفقي (Right % من اليمين):</label>
                          <span className="text-emerald-800 font-sans font-black bg-emerald-100 px-2 py-0.5 rounded-md">
                            {currentCourseCert.studentNameRightPct ?? 26}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="75"
                          step="0.2"
                          value={currentCourseCert.studentNameRightPct ?? 26}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { studentNameRightPct: val }));
                          }}
                          className="w-full accent-emerald-700 cursor-pointer"
                        />
                      </div>

                      {/* Scale / Font Size (%) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">حجم وتكبير الاسم (Scale %):</label>
                          <span className="text-emerald-800 font-sans font-black bg-emerald-100 px-2 py-0.5 rounded-md">
                            {currentCourseCert.studentNameScalePct ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="180"
                          step="1"
                          value={currentCourseCert.studentNameScalePct ?? 100}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { studentNameScalePct: val }));
                          }}
                          className="w-full accent-emerald-700 cursor-pointer"
                        />
                      </div>

                      {/* Color of Student Name */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">لون خط اسم الطالب:</label>
                        <div className="flex items-center gap-2">
                          {['#0f172a', '#064e3b', '#1e1b4b', '#78350f', '#000000'].map((clr) => (
                            <button
                              key={clr}
                              type="button"
                              onClick={() => {
                                setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { studentNameColor: clr }));
                              }}
                              className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110"
                              style={{ backgroundColor: clr }}
                            />
                          ))}
                          <input
                            type="color"
                            value={currentCourseCert.studentNameColor || '#0f172a'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { studentNameColor: val }));
                            }}
                            className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Percentage & Score Controls */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 text-xs font-tajawal">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold font-quran text-sm text-slate-900 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                          مواضع وتنسيق النسبة المئوية للنتيجة
                        </span>
                      </div>

                      {/* Vertical Position (Top %) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">الارتفاع الرأسي (Top % من الأعلى):</label>
                          <span className="text-amber-900 font-sans font-black bg-amber-100 px-2 py-0.5 rounded-md">
                            {currentCourseCert.scoreTopPct ?? 56.8}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          step="0.2"
                          value={currentCourseCert.scoreTopPct ?? 56.8}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { scoreTopPct: val }));
                          }}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      {/* Horizontal Position (Right %) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">الموضع الأفقي (Right % من اليمين):</label>
                          <span className="text-amber-900 font-sans font-black bg-amber-100 px-2 py-0.5 rounded-md">
                            {currentCourseCert.scoreRightPct ?? 38.0}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="75"
                          step="0.2"
                          value={currentCourseCert.scoreRightPct ?? 38.0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { scoreRightPct: val }));
                          }}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      {/* Scale / Font Size (%) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">حجم وتكبير النسبة (Scale %):</label>
                          <span className="text-amber-900 font-sans font-black bg-amber-100 px-2 py-0.5 rounded-md">
                            {currentCourseCert.scoreScalePct ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="180"
                          step="1"
                          value={currentCourseCert.scoreScalePct ?? 100}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { scoreScalePct: val }));
                          }}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      {/* Color of Score */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">لون خط النسبة المئوية:</label>
                        <div className="flex items-center gap-2">
                          {['#0f172a', '#9a3412', '#064e3b', '#1e1b4b', '#000000'].map((clr) => (
                            <button
                              key={clr}
                              type="button"
                              onClick={() => {
                                setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { scoreColor: clr }));
                              }}
                              className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110"
                              style={{ backgroundColor: clr }}
                            />
                          ))}
                          <input
                            type="color"
                            value={currentCourseCert.scoreColor || '#0f172a'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCertConfig((prev) => updateCourseCertSettingsInConfig(prev, certCourseTab, { scoreColor: val }));
                            }}
                            className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Live Interactive Certificate Preview Box */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold font-quran text-sm text-slate-900 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-700" />
                        معاينة حية ومباشرة لشهادة ({selectedCertCourse?.title}) بالشكل النهائي:
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-tajawal">
                        <span className="text-slate-500 font-bold ml-1">تجربة النسبة:</span>
                        {[100, 98, 95, 90, 89].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setCertPreviewPercentage(pct)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
                              certPreviewPercentage === pct
                                ? 'bg-emerald-800 text-amber-300 shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            %{pct}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-2 border-amber-300/80 rounded-3xl overflow-hidden shadow-xl max-w-3xl mx-auto p-4 bg-slate-900/5">
                      <CertificateTemplateView
                        studentName="أحمد محمد إبراهيم (معاينة تجريبية)"
                        percentage={certPreviewPercentage}
                        config={certConfig}
                        courseId={certCourseTab}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 5: SUPER ADMIN TRAINERS & LICENSES MANAGEMENT */}
          {activeTab === 'trainers' && (
            <AdminTrainersPanel
              onSelectTrainerForFilter={(trId) => {
                setTrainerFilter(trId);
                setActiveTab('submissions');
              }}
            />
          )}

          {/* TAB: TEACHER GUIDE (ANSWERS & HOMEWORK SOLUTIONS) */}
          {activeTab === 'teacher_guide' && (
            <TeacherGuidePanel
              activeCourseId={selectedCourseId}
              onSelectCourseToView={(cId) => {
                setSelectedCourseId(cId);
              }}
            />
          )}

          {/* TAB 6: BAGS & LESSONS MANAGEMENT */}
          {activeTab === 'bag_management' && (
            <BagManagementPanel
              activeCourseId={selectedCourseId}
              onSelectCourseToView={(cId) => {
                setSelectedCourseId(cId);
              }}
            />
          )}

          {/* TAB: STUDENTS ACCESS & LOCK MANAGEMENT */}
          {activeTab === 'students_access' && (
            <StudentAccessManagementPanel
              activeCourseId={selectedCourseId}
            />
          )}

          {/* TAB: INSTITUTE THEMES & GROUP CUSTOMIZATION */}
          {activeTab === 'institute_themes' && (
            <InstituteThemeCustomizerPanel />
          )}

          {/* TAB 7: WAITLIST & ENROLLMENT MANAGEMENT */}
          {activeTab === 'waitlist' && (
            <TeacherWaitlistPanel
              activeCourseId={selectedCourseId}
            />
          )}

        </div>
      </div>

      {/* MODAL: ADD / EDIT UNIT QUESTION */}
      {isAddingUnitQ && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border-2 border-amber-400 shadow-2xl font-tajawal text-right dir-rtl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold font-quran text-slate-900">
                {editingUnitQ ? 'تعديل صياغة أو خيارات سؤال الدرس' : 'إضافة سؤال جديد لاختبار الباب'}
                <span className="text-xs text-amber-800 font-sans mr-2">
                  ({isIdgham ? 'حقيبة الإدغام' : 'حقيبة الساكنين'} - الباب {selectedUnitNumber})
                </span>
              </h3>
              <button
                onClick={() => setIsAddingUnitQ(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnitQ} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">صياغة السؤال (نص السؤال):</label>
                <textarea
                  value={unitQText}
                  onChange={(e) => setUnitQText(e.target.value)}
                  placeholder="أدخل نص السؤال وصياغته الدقيقة..."
                  rows={3}
                  required
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-tajawal text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">الخيارات الأربعة (وحدد الخيار الصحيح):</label>
                
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctUnitOpt"
                    checked={unitQCorrectIdx === 0}
                    onChange={() => setUnitQCorrectIdx(0)}
                    className="w-4 h-4 text-emerald-700 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={unitQOpt0}
                    onChange={(e) => setUnitQOpt0(e.target.value)}
                    placeholder="الخيار الأول (أ)"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctUnitOpt"
                    checked={unitQCorrectIdx === 1}
                    onChange={() => setUnitQCorrectIdx(1)}
                    className="w-4 h-4 text-emerald-700 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={unitQOpt1}
                    onChange={(e) => setUnitQOpt1(e.target.value)}
                    placeholder="الخيار الثاني (ب)"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctUnitOpt"
                    checked={unitQCorrectIdx === 2}
                    onChange={() => setUnitQCorrectIdx(2)}
                    className="w-4 h-4 text-emerald-700 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={unitQOpt2}
                    onChange={(e) => setUnitQOpt2(e.target.value)}
                    placeholder="الخيار الثالث (ج)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctUnitOpt"
                    checked={unitQCorrectIdx === 3}
                    onChange={() => setUnitQCorrectIdx(3)}
                    className="w-4 h-4 text-emerald-700 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={unitQOpt3}
                    onChange={(e) => setUnitQOpt3(e.target.value)}
                    placeholder="الخيار الرابع (د)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الشرح والعلة العلمية لنموذج الإجابة:</label>
                <textarea
                  value={unitQExplanation}
                  onChange={(e) => setUnitQExplanation(e.target.value)}
                  placeholder="أدخل التوضيح أو العلة الصوتية أو التجويدية للاختيار الصحيح..."
                  rows={2}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-tajawal text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingUnitQ(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-900 text-amber-300 font-bold rounded-xl text-xs hover:bg-emerald-950 transition-all shadow-md cursor-pointer"
                >
                  حفظ السؤال والتأكيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COMPREHENSIVE EXAM QUESTION */}
      {isAddingExamQ && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border-2 border-amber-400 shadow-2xl font-tajawal text-right dir-rtl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold font-quran text-slate-900">
                {editingExamQ ? 'تعديل سؤال في بنك الاختبار الشامل' : 'إضافة سؤال جديد لبنك الاختبار الشامل'}
                <span className="text-xs text-amber-800 font-sans mr-2">
                  ({isIdgham ? 'حقيبة الإدغام' : 'حقيبة الساكنين'})
                </span>
              </h3>
              <button
                onClick={() => setIsAddingExamQ(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamQ} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الباب المرتبط:</label>
                  <select
                    value={examQUnitNum}
                    onChange={(e) => setExamQUnitNum(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold"
                  >
                    {availableUnitNumbers.map((num) => (
                      <option key={num} value={num}>الباب {num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستوى التعليمي:</label>
                  <select
                    value={examQLevel}
                    onChange={(e) => setExamQLevel(e.target.value as ExamDifficultyLevel)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold"
                  >
                    <option value="beginner">🌿 مبتدئ (تأسيسي)</option>
                    <option value="intermediate">⚡ متوسط (منهجي)</option>
                    <option value="advanced">👑 متقدم (إتقان)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع السؤال:</label>
                  <select
                    value={examQType}
                    onChange={(e) => setExamQType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold"
                  >
                    <option value="mcq">اختيار من متعدد</option>
                    <option value="analysis">تحليل وشواهد</option>
                    <option value="correction">تصويب خطأ أو لحن</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدرجات المخصصة:</label>
                  <input
                    type="number"
                    value={examQPoints}
                    onChange={(e) => setExamQPoints(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">صياغة السؤال:</label>
                <textarea
                  value={examQText}
                  onChange={(e) => setExamQText(e.target.value)}
                  placeholder="أدخل صياغة السؤال..."
                  rows={3}
                  required
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-tajawal text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">موضع الآية أو الكلمة المستهدفة (اختياري):</label>
                <input
                  type="text"
                  value={examQContext}
                  onChange={(e) => setExamQContext(e.target.value)}
                  placeholder="مثال: قُلِ ادْعُوا اللَّهَ أَوْ ادْعُوا الرَّحْمَنَ"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-quran text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">الخيارات الأربعة:</label>
                <input
                  type="text"
                  value={examQOpt0}
                  onChange={(e) => setExamQOpt0(e.target.value)}
                  placeholder="الخيار (أ)"
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
                <input
                  type="text"
                  value={examQOpt1}
                  onChange={(e) => setExamQOpt1(e.target.value)}
                  placeholder="الخيار (ب)"
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
                <input
                  type="text"
                  value={examQOpt2}
                  onChange={(e) => setExamQOpt2(e.target.value)}
                  placeholder="الخيار (ج)"
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
                <input
                  type="text"
                  value={examQOpt3}
                  onChange={(e) => setExamQOpt3(e.target.value)}
                  placeholder="الخيار (د)"
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإجابة النصية الصحيحة (انسخ النص بالضبط من أحد الخيارات أعلاه):</label>
                <input
                  type="text"
                  value={examQCorrectAnswer}
                  onChange={(e) => setExamQCorrectAnswer(e.target.value)}
                  placeholder="النص المطابق للإجابة الصحيحة..."
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الشرح والعلة العلمية لنموذج الإجابة:</label>
                <textarea
                  value={examQExplanation}
                  onChange={(e) => setExamQExplanation(e.target.value)}
                  placeholder="أدخل الشرح والتعليل العلمي..."
                  rows={2}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-tajawal text-xs text-slate-900 bg-white font-bold placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingExamQ(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-900 text-amber-300 font-bold rounded-xl text-xs hover:bg-emerald-950 transition-all shadow-md cursor-pointer"
                >
                  حفظ السؤال في بنك الاختبار الشامل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
