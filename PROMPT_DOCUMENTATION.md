# الدليل الشامل والبرومبت الهندسي لتطوير حقيبة "التقاء الساكنين في علم التجويد والقراءات"

---

## 📌 أولاً: البرومبت الشامل والجامع (Full Prompt & System Specification)

يمكنك استخدام هذا البرومبت الموجه لإنشاء أو إعادة إنتاج التطبيق بالكامل في أي بيئة تفاعلية أو بنية تطويرية:

```text
أنت خبير هندسي ومطور تطبيقات ويب متقدم (Full-Stack TypeScript & React) متخصص في العلوم الشرعية والقرآنية وتقنيات الصوتيات والتجويد.

المطلوب: بناء منصة وتطبيق تعليمي تفاعلي متكامل باسم "حقيبة التقاء الساكنين في التجويد والقراءات"، مخصص للطلاب والمعلمين لتدريس أحكام التخلص من التقاء الساكنين في القرآن الكريم، وفق البنية التقنية والأكاديمية التالية:

1. التصميم البصري والهوية (UI/UX):
   - استخدام واجهة عربية راقية تعتمد على خطي (Tajawal) للنصوص البرمجية والبطاقات و(Amiri/Quran) للآيات والشواهد القرآنية.
   - تطبيق نمط التباين العالي بالألوان التراثية الإسلامية (الأخضر الزيتي العميق، الزمردي، الذهبي الملكي، والرمادي الهادئ).
   - تجنب العشوائية والإعلانات أو الشاشات الترويجية الزائفة، والتركيز المباشر على المحتوى التعليمي والتفاعلي.

2. الهيكلية العلمية والأبواب الستة (Curriculum Architecture):
   - الباب الأول: المدخل الشامل إلى التقاء الساكنين وضوابطه الكلية.
   - الباب الثاني: التقاء الساكنين في كلمة واحدة (وصلاً ووقفاً، والمد اللازم والوقف العارض).
   - الباب الثالث: التقاء الساكنين في كلمتين (التخلص بالتحريك بالكسر والأصل فيه).
   - الباب الرابع: التقاء الساكنين في كلمتين (التخلص بالفتح والضم وحالات الاستثناء).
   - الباب الخامس: التخلص بالحذف والوقف وأثر حروف المد واللين.
   - الباب السادس: الاستثناءات الجليّة والكلمات الخلافية والتوجيه القرائي.

3. الميزات التفاعلية داخل الأبواب والدروس (Unit Features):
   - عرض الشرح النظري المدعم بالتشجير الذهني والتوضيحي (DiagramTreeRenderer).
   - بطاقات أمثلة تطبيقية مع توضيح: (الساكن الأول، الساكن الثاني، موضع الالتقاء، طريقة التخلص، والعلة الصوتية والتجويدية).
   - محاكي الأداء الصوتي اللفظي الصحيح والخاطئ (Pronunciation Simulator).
   - قسم خاص ومستقل داخل الأمثلة والأنشطة لـ "توجيه القراءات وتنوع الروايات" (مثل خلاف حفص مع نافع وابن كثير وأبي عمرو في تحريك الساكن بالضم ﴿قُلُ ادْعُوا﴾ بدلاً من الكسر ﴿قُلِ ادْعُوا﴾، وإسكان ياء ﴿مَحْيَايْ﴾، ونقل ورش ﴿قَدَفْلَحَ﴾، وإدغام فواتح السور ﴿يس ۝ وَالْقُرْآنِ﴾)، مع توضيح العلة النطقية لكل قراءة.
   - أنشطة وتدريبات مرحلية لكل باب تفاعلياً مع التغذية الراجعة الفورية.

4. نظام لوحة المعلم وإدارة الأسئلة السحابية (Teacher Dashboard & Question Management):
   - إنشاء لوحة محماية للمعلم والمدرب تحتوي على 3 أقسام رئيسية:
     أ) سجل نتائج الطلاب: مزامنة سحابية لحظية (Firestore Realtime) لعرض درجات الطلاب، ونسب الإنجاز، مع إمكانية البحث وتصدير التقرير بتنسيق (TXT).
     ب) إدارة أسئلة أبواب الدروس: إمكانية إضافة، تعديل صياغة، أو حذف أسئلة اختبار كل باب من الأبواب الستة وتحديث خياراتها وعللها العلمية.
     ج) إدارة بنك الاختبار الشامل النهائي: التحكم الكامل في بنك أسئلة الاختبار النهائي (الأسئلة الأربعمائة)، وتصنيفها حسب الباب ونوع السؤال (اختيار من متعدد، تحليل وشواهد، تصويب خطأ)، وتحديد الدرجات والسياق القرآني.
   - المزامنة التلقائية اللحظية (Real-time Sync): أي تعديل يجري في صياغة أو بنك الأسئلة من لوحة المعلم يطبق فوراً في واجهة كافة الطلاب دون الحاجة لإعادة تحميل التطبيق.

5. الاختبار الشامل الشهادي (Comprehensive Exam):
   - توليد 20 سؤالاً عشوائياً من بنك الأسئلة المحدث سحابياً مع خلط الخيارات تلقائياً.
   - عداد زمني، نموذج إجابة تفصيلي بعد التسليم، وإمكانية طباعة شهادة التقدير الرسمية باسم الطالب الموثق.

6. قواعد البنية البرمجية واستمرار البيانات (Persistence & Tech Stack):
   - استخدام React 18, TypeScript, Tailwind CSS, Lucide Icons, و Firebase Firestore.
   - حفظ اسم الطالب والتقدم محلياً (LocalStorage) وسحابياً (Firestore) للمزامنة اللحظية.
```

---

## 🛠️ ثانياً: ملخص البنية والملفات الرئيسية المشكلة للنظام

| اسم الملف | المسار | الوظيفة الأساسية |
| :--- | :--- | :--- |
| **دليل الأسئلة السحابي** | `src/utils/questionStorage.ts` | محرك إدارة الأسئلة الديناميكي، يضمن المزامنة اللحظية بين Firestore و LocalStorage مع إطلاق التنبيهات واجهياً عند أي تعديل يقوم به المعلم. |
| **لوحة المعلم المتقدمة** | `src/components/TeacherDashboardModal.tsx` | نافذة المعلم ثلاثية الأقسام (سجلات الطلاب، تعديل أسئلة الأبواب، وتعديل بنك الاختبار الشامل). |
| **عرض الأبواب والدروس** | `src/components/UnitView.tsx` | عرض الدروس والبطاقات الشارحة للأمثلة وقسم (توجيه القراءات القرائية) واختبارات الأبواب المحدثة حياً. |
| **الاختبار الشامل الشهادي** | `src/components/ComprehensiveExamView.tsx` | محرك الاختبار النهائي الشامل يقرأ عشوائياً من بنك الأسئلة السحابي المحدث لحظياً. |
| **بيانات المنهج العلمي** | `src/data/curriculumData.ts` | المادة العلمية للأبواب الستة متضمنة أمثلة وتوجيهات القراءات القرآنية والشواهد الصوتية. |
| **الأنواع والواجهات** | `src/types.ts` | تعريف واجهات البيانات (Question, TajweedExample, StudentSubmission, QuestionsStorageSchema). |

---

## 💻 ثالثاً: كود محرك التخزين والمزامنة السحابية للأسئلة (`questionStorage.ts`)

```typescript
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ComprehensiveExamQuestion } from '../types';
import { COMPREHENSIVE_EXAM_BANK } from '../data/comprehensiveExamData';
import { CURRICULUM_UNITS } from '../data/curriculumData';

export interface UnitQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuestionsStorageSchema {
  unitQuizzes: Record<number, UnitQuizQuestion[]>;
  comprehensiveBank: ComprehensiveExamQuestion[];
  updatedAt: number;
}

const STORAGE_KEY = 'tajweed_custom_question_bank_v2';
const FIRESTORE_DOC_PATH = ['question_banks', 'all_questions'] as const;

export const getDefaultQuestionBank = (): QuestionsStorageSchema => {
  const unitQuizzes: Record<number, UnitQuizQuestion[]> = {};

  CURRICULUM_UNITS.forEach((unit) => {
    if (unit.quiz && unit.quiz.questions) {
      unitQuizzes[unit.unitNumber] = unit.quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  });

  return {
    unitQuizzes,
    comprehensiveBank: COMPREHENSIVE_EXAM_BANK.map((q) => ({ ...q })),
    updatedAt: Date.now(),
  };
};

let currentMemoryBank: QuestionsStorageSchema = getDefaultQuestionBank();
let isInitialized = false;
const listeners: Array<() => void> = [];

export const subscribeQuestionBank = (callback: () => void): (() => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyListeners = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('Question storage listener error:', err);
    }
  });
};

const loadFromLocalStorage = (): QuestionsStorageSchema | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse questions from localStorage:', err);
  }
  return null;
};

const saveToLocalStorage = (data: QuestionsStorageSchema) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save questions to localStorage:', err);
  }
};

const saveToFirestore = async (data: QuestionsStorageSchema) => {
  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.warn('Firestore save question bank failed:', err);
  }
};

export const initQuestionStorageSync = () => {
  if (isInitialized) return;
  isInitialized = true;

  const localData = loadFromLocalStorage();
  if (localData) {
    currentMemoryBank = localData;
    notifyListeners();
  }

  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as QuestionsStorageSchema;
          if (remoteData && remoteData.unitQuizzes && remoteData.comprehensiveBank) {
            currentMemoryBank = remoteData;
            saveToLocalStorage(remoteData);
            notifyListeners();
          }
        }
      },
      (err) => {
        console.warn('Firestore question bank realtime sync error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to setup Firestore question listener:', err);
  }
};

initQuestionStorageSync();

export const getUnitQuizQuestions = (unitNumber: number): UnitQuizQuestion[] => {
  if (currentMemoryBank.unitQuizzes && currentMemoryBank.unitQuizzes[unitNumber]) {
    return currentMemoryBank.unitQuizzes[unitNumber];
  }
  return getDefaultQuestionBank().unitQuizzes[unitNumber] || [];
};

export const getComprehensiveExamBank = (): ComprehensiveExamQuestion[] => {
  if (currentMemoryBank.comprehensiveBank && currentMemoryBank.comprehensiveBank.length > 0) {
    return currentMemoryBank.comprehensiveBank;
  }
  return getDefaultQuestionBank().comprehensiveBank;
};

export const saveUnitQuizQuestion = async (unitNumber: number, question: UnitQuizQuestion) => {
  const bank = { ...currentMemoryBank };
  const unitList = bank.unitQuizzes[unitNumber] ? [...bank.unitQuizzes[unitNumber]] : [];

  const existingIdx = unitList.findIndex((q) => q.id === question.id);
  if (existingIdx !== -1) {
    unitList[existingIdx] = question;
  } else {
    const newId = question.id || Date.now();
    unitList.push({ ...question, id: newId });
  }

  bank.unitQuizzes = { ...bank.unitQuizzes, [unitNumber]: unitList };
  bank.updatedAt = Date.now();

  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const deleteUnitQuizQuestion = async (unitNumber: number, questionId: number) => {
  const bank = { ...currentMemoryBank };
  if (!bank.unitQuizzes[unitNumber]) return;

  bank.unitQuizzes[unitNumber] = bank.unitQuizzes[unitNumber].filter((q) => q.id !== questionId);
  bank.updatedAt = Date.now();

  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const saveComprehensiveExamQuestion = async (question: ComprehensiveExamQuestion) => {
  const bank = { ...currentMemoryBank };
  const examList = [...(bank.comprehensiveBank || [])];

  const existingIdx = examList.findIndex((q) => q.id === question.id);
  if (existingIdx !== -1) {
    examList[existingIdx] = question;
  } else {
    const newId = question.id || Date.now();
    examList.push({ ...question, id: newId });
  }

  bank.comprehensiveBank = examList;
  bank.updatedAt = Date.now();

  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const deleteComprehensiveExamQuestion = async (questionId: number) => {
  const bank = { ...currentMemoryBank };
  bank.comprehensiveBank = (bank.comprehensiveBank || []).filter((q) => q.id !== questionId);
  bank.updatedAt = Date.now();

  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const resetQuestionsToDefault = async () => {
  const defaults = getDefaultQuestionBank();
  currentMemoryBank = defaults;
  saveToLocalStorage(defaults);
  notifyListeners();
  await saveToFirestore(defaults);
};
```
