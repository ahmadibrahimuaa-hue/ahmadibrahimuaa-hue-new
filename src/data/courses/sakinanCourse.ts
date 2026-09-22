import { Course } from '../../types';
import { CURRICULUM_UNITS } from '../curriculumData';
import { SUMMARY_TABLE_DATA } from '../summaryData';
import { EXCEPTION_WORDS_DATA } from '../exceptionWordsData';
import { QURAN_EXAMPLES } from '../examplesData';
import { COMPREHENSIVE_EXAM_BANK } from '../comprehensiveExamData';
import { SCHOLARLY_BOOKS } from '../theoryData';

export const SAKINAN_COURSE: Course = {
  id: 'sakinan',
  title: 'التقاء الساكنين في التلاوة',
  shortTitle: 'التقاء الساكنين',
  subtitle: 'منهج تعليمي تطبيقي متدرج لمعلمي القرآن الكريم والقراءات',
  badge: 'الحقيبة الأولى (المبتدئ)',
  iconName: 'Sparkles',
  description: 'حقيبة تدريبية متكاملة تهدف إلى ضبط أحكام التخلص من التقاء الساكنين في القرآن الكريم وصلاً ووقفاً، وفق رواية حفص عن عاصم وعامة القراء.',
  author: 'أحمد إبراهيم',
  qualificationNote: '«ومؤهل لتدريس المحتوى (التقاء الساكنين في التجويد)»',
  units: CURRICULUM_UNITS,
  summaryTable: SUMMARY_TABLE_DATA,
  exceptionWords: EXCEPTION_WORDS_DATA,
  quranExamples: QURAN_EXAMPLES,
  comprehensiveExamBank: COMPREHENSIVE_EXAM_BANK,
  books: SCHOLARLY_BOOKS,
  status: 'available',
  level: 'beginner',
  levelText: 'حقيبة المستوى التأسيسي (المبتدئ)',
  targetAudience: 'معلمو ومعلمات القرآن الكريم، وطلبة العلم المجازين والمبتدئين',
  pricing: {
    isPaid: false,
    priceText: 'متاحة مجاناً ومعتمدة بالكامل',
  },
  expectedDuration: '10 محاضرات تدريبية مكثفة',
  features: [
    '5 أبواب دراسية تفاعلية',
    'مختبر قرآني متكامل للأمثلة والتسجيلات',
    'بنك اختبارات شامل واستخراج فوري للشهادات',
    'منظومات وقواعد حصرية للحفظ'
  ]
};
