import { Course } from '../../types';
import { MAKHARIJ_UNIT_1 } from './makharij/makharijUnits1';
import { MAKHARIJ_UNIT_2 } from './makharij/makharijUnits2';
import { MAKHARIJ_UNIT_3 } from './makharij/makharijUnits3';
import {
  MAKHARIJ_SUMMARY_TABLE,
  MAKHARIJ_EXCEPTION_WORDS,
  MAKHARIJ_QURAN_EXAMPLES,
  MAKHARIJ_COMPREHENSIVE_EXAM_BANK,
  MAKHARIJ_BOOKS,
} from './makharij/makharijData';

export const MAKHARIJ_UNITS = [
  MAKHARIJ_UNIT_1,
  MAKHARIJ_UNIT_2,
  MAKHARIJ_UNIT_3,
];

export { MAKHARIJ_COMPREHENSIVE_EXAM_BANK };

export const MAKHARIJ_COURSE: Course = {
  id: 'makharij',
  title: 'مخارج الحروف وصفاتها ودقائق تحريراتها',
  shortTitle: 'مخارج الحروف وصفاتها',
  subtitle: 'الحقيبة التخصصية المتقدمة لضبط مخارج الحروف العربية وصفاتها الذاتية وتخليص المتجاورات',
  badge: 'الحقيبة الثالثة (المتقدم)',
  iconName: 'Sparkles',
  description: 'حقيبة متقدمة وشاملة تركز على التشريح الصوتي لمخارج الحروف السبعة عشر، وتحقيق صفات القوة والضعف، والاستعلاء والإطباق، وضبط مراتب التفخيم وأحكام الراءات، وتخليص الحروف المرققة من المفخمة بدقة متناهية.',
  author: 'أحمد إبراهيم',
  qualificationNote: '«ومؤهل لتدريس المحتوى (مخارج الحروف وصفاتها ودقائق تحريراتها)»',
  status: 'available',
  level: 'advanced',
  levelText: 'حقيبة المستوى المتقدم (المخارج والصفات)',
  targetAudience: 'المعلمون المجازون، وطلاب معاهد القراءات والتجويد، والراغبون في إتقان مخارج الحروف وصفاتها',
  pricing: {
    isPaid: false,
    priceText: 'متاحة بالكامل لجميع الدارسين'
  },
  prerequisites: [
    'إتقان قراءة القرآن الكريم برواية حفص عن عاصم',
    'استيعاب المبادئ التأسيسية لأحكام التجويد'
  ],
  expectedDuration: '12 محاضرة تدريبية وصوتية متخصصة',
  features: [
    'شرح استقصائي للمخارج العامة الخمسة والمخارج الخاصة الـ 17',
    'دراسة موازين الصفات الذاتية ذات الأضداد والتي لا ضد لها',
    'قواعد وضوابط مراتب التفخيم وأحكام الراءات واللامات والألفات',
    'تدريب ميداني وتفكيك صوتي لتخليص الحروف المرققة من المفخمة',
    'بنك تدريبات واختبارات شاملة ونماذج قرآنية ومراجع علمية معتمدة'
  ],
  previewHighlights: [
    {
      title: 'المخارج العامة والخاصة (17 مخرجاً)',
      description: 'دراسة استقصائية لمخارج الجوف والحلق واللسان والشفتين والخيشوم وتطبيقاتها العملية.',
      badge: 'الباب الأول (5 دروس)'
    },
    {
      title: 'الصفات اللازمة ذات الأضداد وغير ذات الأضداد',
      description: 'ضبط الهمس والجهر والشدة والرخوة والتوسط والاستعلاء والإطباق والقلقلة والاستطالة.',
      badge: 'الباب الثاني (3 دروس)'
    },
    {
      title: 'التفخيم والترقيق وتخليص الحروف المتجاورة',
      description: 'أدق أبواب التجويد الميداني لمراتب التفخيم وأحكام الراءات وضبط الإدغام الناقص.',
      badge: 'الباب الثالث (3 دروس)'
    }
  ],
  units: MAKHARIJ_UNITS,
  summaryTable: MAKHARIJ_SUMMARY_TABLE,
  exceptionWords: MAKHARIJ_EXCEPTION_WORDS,
  quranExamples: MAKHARIJ_QURAN_EXAMPLES,
  comprehensiveExamBank: MAKHARIJ_COMPREHENSIVE_EXAM_BANK,
  books: MAKHARIJ_BOOKS,
};
