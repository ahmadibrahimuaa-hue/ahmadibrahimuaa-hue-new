import { CURRICULUM_UNITS } from '../data/curriculumData';
import { QURAN_EXAMPLES } from '../data/examplesData';
import { EXCEPTION_WORDS_DATA } from '../data/exceptionWordsData';
import { SUMMARY_TABLE_DATA } from '../data/summaryData';
import { THEORY_CHAPTERS } from '../data/theoryData';

export type SearchResultCategory = 'all' | 'shawahid_examples' | 'lessons' | 'exceptions' | 'summary_rules';

export interface SakinanSearchResult {
  id: string;
  category: 'shawahid_examples' | 'lessons' | 'exceptions' | 'summary_rules';
  categoryLabel: string;
  categoryColor: string;
  title: string;
  subtitle: string;
  matchedSnippet: string;
  highlightWords: string[];
  targetTab: 'units' | 'examples' | 'exceptions' | 'summary' | 'rules';
  unitIndex?: number;
  lessonId?: string;
  exampleId?: string;
  badgeText?: string;
  metaInfo?: string;
}

/**
 * دالة توحيد وتطبيع النص العربي للبحث السريع الذكي
 * تزيل التشكيل (الحركات)، التنوين، سكون وضبط المصحف الشريف، وتوحّد الألفات والهمزات، والهاء/التاء المربوطة، والألف المقصورة
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    // إزالة علامات التشكيل، التنوين، السكون المصحفي، وعلامات الضبط العثمانية
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // إزالة علامات المصحف الخاصة والأقواس
    .replace(/[﴿﴾«»""''(){}\[\]<>،.:;؟!\-–—/\\_~*^#]/g, ' ')
    // توحيد جميع أشكال الألف والهمزة (أ، إ، آ، ٱ -> ا)
    .replace(/[إأآٱآأإ]/g, 'ا')
    .replace(/ء/g, '')
    // توحيد الياء والألف المقصورة
    .replace(/ى/g, 'ي')
    // توحيد التاء المربوطة والهاء
    .replace(/ة/g, 'ه')
    // توحيد واو الهمزة وياء الهمزة
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // توحيد المسافات
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * استخراج مقتطف نصي ذكي يحتوي الكلمة المبحوث عنها مع سياق مقروء
 */
function extractSnippet(fullText: string, queryRaw: string, maxLength: number = 140): string {
  if (!fullText) return '';
  const cleanFull = fullText.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedFull = normalizeArabicText(cleanFull);
  const normalizedQuery = normalizeArabicText(queryRaw);

  const idx = normalizedFull.indexOf(normalizedQuery);
  if (idx === -1) {
    return cleanFull.length > maxLength ? cleanFull.slice(0, maxLength) + '...' : cleanFull;
  }

  const start = Math.max(0, idx - 45);
  const end = Math.min(cleanFull.length, idx + normalizedQuery.length + 80);

  let snippet = cleanFull.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < cleanFull.length) snippet = snippet + '...';

  return snippet;
}

/**
 * فحص ما إذا كان النص يحتوي على الكلمة المبحوث عنها بعد التطبيع ومطابقة الكلمات
 */
function textMatches(sourceText: string, normalizedQuery: string, tokens: string[] = []): boolean {
  if (!sourceText || !normalizedQuery) return false;
  const normSource = normalizeArabicText(sourceText);
  if (normSource.includes(normalizedQuery)) return true;
  if (tokens.length > 1 && tokens.every(tok => normSource.includes(tok))) return true;
  return false;
}

/**
 * محرك البحث الفوري في محتوى حقيبة 'التقاء الساكنين'
 */
export function searchSakinanCourse(
  query: string,
  category: SearchResultCategory = 'all',
  limit: number = 30
): SakinanSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const normQuery = normalizeArabicText(trimmed);
  const queryTokens = normQuery.split(' ').filter(t => t.length > 0);
  const results: SakinanSearchResult[] = [];

  // 1. البحث في المختبر القرآني للأمثلة والشواهد (QURAN_EXAMPLES)
  if (category === 'all' || category === 'shawahid_examples') {
    for (const ex of QURAN_EXAMPLES) {
      const matchAyah = textMatches(ex.ayahText, normQuery, queryTokens);
      const matchPhrase = textMatches(ex.targetPhrase, normQuery, queryTokens);
      const matchReason = textMatches(ex.reason, normQuery, queryTokens);
      const matchMethod = textMatches(ex.method, normQuery, queryTokens);
      const matchDisposal = textMatches(ex.disposalDetails, normQuery, queryTokens);
      const matchScholarly = textMatches(ex.scholarlyNote || '', normQuery, queryTokens);
      const matchSurah = textMatches(ex.surahName, normQuery, queryTokens);
      const matchPronunciation = textMatches(ex.pronunciationGuide || '', normQuery, queryTokens);

      if (matchAyah || matchPhrase || matchReason || matchMethod || matchDisposal || matchScholarly || matchSurah || matchPronunciation) {
        const snippetSource = matchPhrase 
          ? `${ex.targetPhrase}: ${ex.ayahText}`
          : matchReason 
            ? ex.reason 
            : matchDisposal 
              ? ex.disposalDetails 
              : ex.ayahText;

        results.push({
          id: `ex-${ex.id}`,
          category: 'shawahid_examples',
          categoryLabel: 'شاهد قرآني ومثال تطبيقي',
          categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          title: `﴿${ex.targetPhrase}﴾`,
          subtitle: `سورة ${ex.surahName} (الآية ${ex.ayahNumber}) • ${ex.method}`,
          matchedSnippet: extractSnippet(snippetSource, trimmed),
          highlightWords: [trimmed, ...queryTokens],
          targetTab: 'examples',
          exampleId: ex.id,
          badgeText: ex.method.trim(),
          metaInfo: `الأول: ${ex.firstSukoon} | الثاني: ${ex.secondSukoon}`,
        });
      }
    }
  }

  // 2. البحث في أبواب ودروس الكتاب التدريبي (CURRICULUM_UNITS)
  if (category === 'all' || category === 'lessons') {
    CURRICULUM_UNITS.forEach((unit, uIdx) => {
      // بحث في عنوان الباب ووصفه
      const matchUnitTitle = textMatches(unit.title, normQuery, queryTokens);
      const matchUnitDesc = textMatches(unit.description, normQuery, queryTokens);

      unit.lessons.forEach((lesson) => {
        const matchLessonTitle = textMatches(lesson.title, normQuery, queryTokens);
        const matchLessonSubtitle = textMatches(lesson.subtitle, normQuery, queryTokens);
        const matchContent = textMatches(lesson.contentMarkdown, normQuery, queryTokens);
        const matchObjectives = lesson.objectives?.some(obj => textMatches(obj, normQuery, queryTokens));
        const matchHomework = textMatches(lesson.homeworkTask || '', normQuery, queryTokens);

        if (matchLessonTitle || matchLessonSubtitle || matchContent || matchObjectives || matchHomework || matchUnitTitle || matchUnitDesc) {
          const snippetSource = matchContent
            ? lesson.contentMarkdown
            : matchLessonSubtitle 
              ? `${lesson.title} - ${lesson.subtitle}` 
              : unit.description;

          results.push({
            id: `lesson-${lesson.id}`,
            category: 'lessons',
            categoryLabel: `الباب ${unit.unitNumber}: درس تعليمي`,
            categoryColor: 'bg-amber-50 text-amber-900 border-amber-300',
            title: lesson.title,
            subtitle: `${unit.title} • ${lesson.subtitle}`,
            matchedSnippet: extractSnippet(snippetSource, trimmed),
            highlightWords: [trimmed, ...queryTokens],
            targetTab: 'units',
            unitIndex: uIdx,
            lessonId: lesson.id,
            badgeText: `الباب ${unit.unitNumber}`,
            metaInfo: `درس ${lesson.lessonNumber}`,
          });
        }
      });
    });
  }

  // 3. البحث في الكلمات المستثناة (EXCEPTION_WORDS_DATA)
  if (category === 'all' || category === 'exceptions') {
    for (const exc of EXCEPTION_WORDS_DATA) {
      const matchWord = textMatches(exc.word, normQuery, queryTokens);
      const matchSurah = textMatches(exc.surah, normQuery, queryTokens);
      const matchOrigin = textMatches(exc.originText, normQuery, queryTokens);
      const matchCause = textMatches(exc.sukoonCause, normQuery, queryTokens);
      const matchMethod = textMatches(exc.disposalMethod, normQuery, queryTokens);
      const matchDirection = textMatches(exc.scholarlyDirection || '', normQuery, queryTokens);
      const matchOptions = exc.readingOptions?.some(opt => textMatches(opt, normQuery, queryTokens));

      if (matchWord || matchSurah || matchOrigin || matchCause || matchMethod || matchDirection || matchOptions) {
        results.push({
          id: `exc-${exc.id}`,
          category: 'exceptions',
          categoryLabel: 'كلمة مستثناة في القراءات',
          categoryColor: 'bg-purple-50 text-purple-900 border-purple-300',
          title: `كلمة ﴿${exc.word}﴾`,
          subtitle: `سورة ${exc.surah} • الآية ${exc.ayah}`,
          matchedSnippet: extractSnippet(matchOrigin ? exc.originText : matchCause ? exc.sukoonCause : exc.disposalMethod, trimmed),
          highlightWords: [trimmed, ...queryTokens],
          targetTab: 'exceptions',
          badgeText: exc.isHafsSpecific ? 'خاصة بحفص' : 'عامة القراء',
          metaInfo: exc.disposalMethod,
        });
      }
    }
  }

  // 4. البحث في جدول المقارنة الشامل والقواعد الكلية (SUMMARY_TABLE_DATA & THEORY)
  if (category === 'all' || category === 'summary_rules') {
    for (const sum of SUMMARY_TABLE_DATA) {
      const matchType = textMatches(sum.type, normQuery, queryTokens);
      const matchCond = textMatches(sum.condition, normQuery, queryTokens);
      const matchMethod = textMatches(sum.disposalMethod, normQuery, queryTokens);
      const matchEx = textMatches(sum.exampleText, normQuery, queryTokens);
      const matchRule = textMatches(sum.tajweedRule, normQuery, queryTokens);
      const matchNote = textMatches(sum.scholarlyNote || '', normQuery, queryTokens);

      if (matchType || matchCond || matchMethod || matchEx || matchRule || matchNote) {
        results.push({
          id: `sum-${sum.id}`,
          category: 'summary_rules',
          categoryLabel: 'قاعدة في جدول المقارنة الشامل',
          categoryColor: 'bg-blue-50 text-blue-900 border-blue-300',
          title: sum.type,
          subtitle: `طريقة التخلص: ${sum.disposalMethod} • المرجع: ${sum.surahRef}`,
          matchedSnippet: extractSnippet(`${sum.exampleText} - ${sum.tajweedRule} - ${sum.condition}`, trimmed),
          highlightWords: [trimmed, ...queryTokens],
          targetTab: 'summary',
          badgeText: sum.disposalMethod,
          metaInfo: sum.surahRef,
        });
      }
    }

    // فصول التأصيل العلمي
    for (const chap of THEORY_CHAPTERS) {
      const matchTitle = textMatches(chap.title, normQuery, queryTokens);
      const matchSub = textMatches(chap.subtitle, normQuery, queryTokens);
      const matchContent = textMatches(chap.content, normQuery, queryTokens);

      if (matchTitle || matchSub || matchContent) {
        results.push({
          id: `theory-${chap.id}`,
          category: 'summary_rules',
          categoryLabel: 'منظومة وقاعدة تأصيلية',
          categoryColor: 'bg-indigo-50 text-indigo-900 border-indigo-300',
          title: chap.title,
          subtitle: chap.subtitle,
          matchedSnippet: extractSnippet(chap.content, trimmed),
          highlightWords: [trimmed, ...queryTokens],
          targetTab: 'rules',
          badgeText: 'تأصيل نظري',
        });
      }
    }
  }

  // ترتيب النتائج بحسب دقة المطابقة في العنوان أولاً
  results.sort((a, b) => {
    const aInTitle = textMatches(a.title, normQuery) ? 2 : 0;
    const bInTitle = textMatches(b.title, normQuery) ? 2 : 0;
    return bInTitle - aInTitle;
  });

  return results.slice(0, limit);
}

export const POPULAR_SAKINAN_SEARCH_TERMS = [
  'قل ادعوا',
  'أن اعبدوا',
  'المد اللازم',
  'التحريك بالكسر',
  'التحريك بالضم',
  'التحريك بالفتح',
  'حذف حرف المد',
  'يهدي',
  'نعما',
  'آلآن',
  'عاصم',
  'ميم الجمع',
  'نون من الجارة',
  'وقفاً ووصلاً'
];
