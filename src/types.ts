export type DisposalMethod = 
  | 'تحريك بالكسر'
  | 'تحريك بالفتح'
  | 'تحريك بالضم'
  | 'تحريك بالفتح / الكسر'
  | 'حذف حرف المد لفظاً'
  | 'سقوط همزة الوصل'
  | 'جائز (المد اللازم)'
  | 'جائز (عند الوقف)';

export interface QuranExample {
  id: string;
  ayahText: string;
  surahName: string;
  ayahNumber: number | string;
  targetPhrase: string;
  firstSukoon: string;
  secondSukoon: string;
  reason: string;
  method: DisposalMethod | string;
  disposalDetails: string;
  pronunciationGuide: string;
  commonMistake: string;
  scholarlyNote?: string;
  qiraatNote?: string;
  audioPronunciationText: string;
  incorrectPronunciationText: string;
  isFirstSukoonCorrect?: boolean; // true = صحيح, false = معتل
  isSecondSukoonOriginal?: boolean; // true = أصلي, false = عارض
}

export interface SummaryTableRow {
  id: string;
  type: string;
  condition: string;
  disposalMethod: string;
  exampleText: string;
  surahRef: string;
  tajweedRule: string;
  scholarlyNote: string;
}

export interface ExceptionWord {
  id: string;
  word: string;
  surah: string;
  ayah: number | string;
  originText: string;
  sukoonCause: string;
  disposalMethod: string;
  readingOptions: string[];
  isHafsSpecific: boolean;
  scholarlyDirection: string;
  otherRecitersNotes?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  subtitle?: string;
  children?: MindMapNode[];
  badge?: string;
}

export interface ExerciseItem {
  id: string;
  type: 'extract' | 'classify' | 'analyze' | 'correct';
  title: string;
  question: string;
  ayahText?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface DiagramBranch {
  title: string;
  badge?: string;
  color?: 'emerald' | 'amber' | 'purple' | 'blue' | 'rose';
  details: string[];
}

export interface DiagramTree {
  mainTitle: string;
  subTitle?: string;
  branches: DiagramBranch[];
}

export interface Lesson {
  id: string;
  lessonNumber: number;
  title: string;
  subtitle: string;
  objectives: string[];
  contentMarkdown: string;
  videoUrl?: string; // رابط فيديو شرحي للدرس (يوتيوب أو رابط مباشر MP4)
  diagramTree?: DiagramTree;
  examples: QuranExample[];
  summaryPoints: string[];
  summaryTable?: SummaryTableRow[];
  exercises: ExerciseItem[];
  discussionQuestions: string[];
  discussionAnswers?: string[]; // إجابات أسئلة المناقشة في نسخة المعلم
  homeworkTask: string;
  homeworkSolution?: string; // إجابة الواجب المنزلي في نسخة المعلم
  recitationTask: string;
  recitationGuide?: string; // توجيه الأداء والتلاوة في نسخة المعلم
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  description: string;
  estimatedLectures: string; // e.g., "محاضرتان إلى 3 محاضرات"
  lessons: Lesson[];
  mindMap: MindMapNode;
  unitReviewMarkdown: string;
  quiz: {
    id: string;
    title: string;
    questions: {
      id: number;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
  commonMistakes: {
    mistake: string;
    cause: string;
    effect?: string;
    correction: string;
    exampleWrong: string;
    exampleRight: string;
  }[];
}

export interface ScholarlyBook {
  title: string;
  author: string;
  description: string;
  importance: string;
}

export type ExamDifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ComprehensiveExamQuestion {
  id: number;
  unitNumber: number;
  type: 'mcq' | 'analysis' | 'correction';
  question: string;
  contextText?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  level?: ExamDifficultyLevel; // مبتدئ | متوسط | متقدم
}

export interface ReviewQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
  sourceBook: string;
}

export interface MultipleChoiceQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface ExtractionExercise {
  id: number;
  ayahText: string;
  surahInfo: string;
  targetPhrase: string;
  firstSukoon: string;
  secondSukoon: string;
  correctMethod: string;
  explanation: string;
  optionsForMethod: string[];
}

export type CourseStatus = 'available' | 'coming_soon' | 'locked';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface CoursePreviewHighlight {
  title: string;
  description: string;
  badge?: string;
}

export interface Course {
  id: string; // e.g. 'sakinan' | 'idgham' | 'makharij' | 'ijazah'
  title: string;
  shortTitle: string;
  subtitle: string;
  badge: string;
  iconName: string;
  description: string;
  author: string;
  qualificationNote: string; // Note printed on certificate if score >= 98%
  units: Unit[];
  summaryTable: SummaryTableRow[];
  exceptionWords: ExceptionWord[];
  quranExamples: QuranExample[];
  comprehensiveExamBank: ComprehensiveExamQuestion[];
  books?: ScholarlyBook[];
  rulesCheatSheetMarkdown?: string;
  // Flexible Bag Management Schema Properties:
  status?: CourseStatus; // 'available' (نشطة) | 'coming_soon' (قريباً - محتوى مدفوع/قيد التطوير) | 'locked'
  level?: CourseLevel; // المستوى الأكاديمي
  levelText?: string; // e.g. "المستوى الأول: المبتدئ"
  targetAudience?: string; // الفئة المستهدفة
  pricing?: {
    isPaid: boolean;
    priceText?: string;
    note?: string;
  };
  prerequisites?: string[];
  expectedDuration?: string;
  features?: string[];
  waitlistCount?: number;
  previewHighlights?: CoursePreviewHighlight[];
  // Nested structure and ordering:
  parentCourseId?: string | null; // معرف الحقيبة الأم إذا كانت هذه حقيبة فرعية مدمجة
  order?: number; // ترتيب الحقيبة في العرض والقائمة
}

export interface TrainerPermissions {
  canManageStudents: boolean;      // إدارة الطلاب ورصد الدرجات والشهادات
  canViewAnalytics: boolean;       // الاطلاع على الإحصائيات والرسوم البيانية
  canEditCertificates: boolean;    // تخصيص وتعديل قوالب الشهادات
  canEditCheatSheet: boolean;      // تعديل وإضافة أحكام في المطوية التجويدية
  canManageUnits: boolean;         // تعديل وتنظيم الأبواب والدروس
  canManageCourses: boolean;       // إضافة وتعديل الحقائب التعليمية
  canManageQuestions: boolean;     // تعديل بنوك أسئلة الأبواب والاختبار الشامل
}

export interface TrainerAccount {
  id: string; // unique doc id or username
  name: string; // Trainer Full Name (e.g. "د. أحمد محمد إبراهيم")
  username: string; // login identifier
  password: string; // trainer passcode
  role: 'super_admin' | 'trainer';
  status: 'active' | 'suspended';
  referralCode: string; // code to share with students (e.g. "AHMED-QURAN")
  phone?: string;
  notes?: string; // subscription notes (e.g. "اشتراك سنوي معتمد")
  maxStudents?: number; // 0 for unlimited
  permissions?: TrainerPermissions; // صلاحيات المعلم المحددة من المشرف العام
  createdAt: string;
  updatedAt?: number;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  unitTitle: string;
  testType: string; // 'اختبار الباب' | 'الاختبار النهائي' | 'تطبيق درسي'
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  timestamp?: number;
  details?: string;
  trainerId?: string;
  trainerName?: string;
  examLevel?: ExamDifficultyLevel; // مبتدئ | متوسط | متقدم
}

export interface StudentProfile {
  name: string;
  registeredAt: string;
  trainerId?: string;
  trainerName?: string;
  referralCode?: string;
  group?: string; // الحلقة أو المجموعة الطلابية (مثال: 'حلقة الإتقان المسائية')
  instituteName?: string; // المعهد أو المقرأة التابع لها
}

export type ThemePreset = 'emerald' | 'royal_purple' | 'amber_gold' | 'ocean_blue' | 'ruby_crimson' | 'slate_dark';

export interface GroupThemeConfig {
  groupId: string; // اسم أو معرف المجموعة / المعهد (e.g. 'حلقة الإتقان المسائية' أو 'معهد الفرقان')
  groupName: string;
  instituteName: string; // اسم المعهد الرسمي (e.g. 'معهد الفرقان لعلوم القرآن')
  instituteSubtitle?: string; // الدفعة أو الشعار اللفظي
  logoUrl?: string; // رابط صورة الشعار الخاصة بالمعهد أو الحقيبة
  logoIcon?: string; // رمز الشعار البديل: 'quran' | 'crown' | 'award' | 'sparkles' | 'landmark' | 'bookmark' | 'shield' | 'star'
  themePreset: ThemePreset; // نسق الألوان المعتمد
  customPrimaryColor?: string; // لون رئيسي مخصص للحقيبة (Hex)
  customAccentColor?: string; // لون إطار وزخرفة وزينة مخصص (Hex)
  isCustomPalette?: boolean; // هل تم تفعيل لوحة الألوان المخصصة بالكامل
  customBadgeText?: string; // شارة الحقيبة المخصصة لطلاب هذا المعهد
  welcomeMessage?: string; // رسالة ترحيبية خاصة بطلاب هذا المعهد
  updatedAt?: number;
}


