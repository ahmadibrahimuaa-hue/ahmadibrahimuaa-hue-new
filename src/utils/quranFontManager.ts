export interface QuranFontOption {
  id: string;
  name: string;
  category: 'uthmanic' | 'naskh' | 'modern';
  fontFamily: string;
  sampleVerse: string;
  description: string;
  recommendedFor: string;
}

export const QURAN_FONT_OPTIONS: QuranFontOption[] = [
  {
    id: 'amiri',
    name: 'الخط العثماني الأميري (الأصيل)',
    category: 'uthmanic',
    fontFamily: "'Amiri', 'Amiri Quran', serif",
    sampleVerse: 'وَمَا كَانَ اللَّهُ لِيُعَذِّبَهُمْ وَأَنتَ فِيهِمْ ۚ وَمَا كَانَ اللَّهُ مُعَذِّبَهُمْ وَهُمْ يَسْتَغْفِرُونَ',
    description: 'خط مصحفي عثماني أصيل ومشكول بدقة يماثل رسم المصحف الشريف وطباعة مجمع الملك فهد.',
    recommendedFor: 'التلاوة والأمثلة القرآنية الدقيقة والشواهد التجويدية',
  },
  {
    id: 'scheherazade',
    name: 'خط شهرزاد القرآني المحقق',
    category: 'uthmanic',
    fontFamily: "'Scheherazade New', serif",
    sampleVerse: 'قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ',
    description: 'خط تراثي رصين بوضوح عالٍ جداً للحركات التجويدية والهمزات والوقف.',
    recommendedFor: 'القراءة الهادئة والوضوح البصري المريح',
  },
  {
    id: 'noto-naskh',
    name: 'خط النسخ القرآني الميسر (Noto Naskh)',
    category: 'naskh',
    fontFamily: "'Noto Naskh Arabic', serif",
    sampleVerse: 'الرَّحْمَٰنُ عَلَى الْعَرْشِ اسْتَوَىٰ ۝ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
    description: 'خط نسخ عربي هندسي عالي المقروئية ملائم لجميع مقاسات الشاشات والهواتف.',
    recommendedFor: 'الطلاب المبتدئين والأجهزة الصغيرة والشاشات المحمولة',
  },
  {
    id: 'tajawal',
    name: 'خط النسخ القياسي المعاصر (تجوال)',
    category: 'naskh',
    fontFamily: "'Tajawal', sans-serif",
    sampleVerse: 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ',
    description: 'خط حديث سلس بدون تعقيد، مناسب للمتن والقواعد والتلخيصات السريعة.',
    recommendedFor: 'الدراسة السريعة وقراءة القواعد النظرية',
  },
  {
    id: 'cairo',
    name: 'خط القاهرة المتوازن (Cairo)',
    category: 'modern',
    fontFamily: "'Cairo', sans-serif",
    sampleVerse: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ۝ إِنَّا سَنُلْقِي عَلَيْكَ قَوْلًا ثَقِيلًا',
    description: 'خط واضح قوي العناوين، ذو مقروئية استثنائية للحروف المشددة والمدود.',
    recommendedFor: 'العرض الإيضاحي والشاشات الكبيرة والمحاضرات',
  },
];

const STORAGE_KEY = 'tajweed_selected_quran_font_v1';
const FONT_CHANGE_EVENT = 'tajweed_quran_font_changed';

export function getSelectedQuranFontId(): string {
  if (typeof window === 'undefined') return 'amiri';
  return localStorage.getItem(STORAGE_KEY) || 'amiri';
}

export function getSelectedQuranFont(): QuranFontOption {
  const currentId = getSelectedQuranFontId();
  return QURAN_FONT_OPTIONS.find((f) => f.id === currentId) || QURAN_FONT_OPTIONS[0];
}

export function setQuranFont(fontId: string): void {
  if (typeof window === 'undefined') return;
  const option = QURAN_FONT_OPTIONS.find((f) => f.id === fontId);
  if (!option) return;

  localStorage.setItem(STORAGE_KEY, fontId);
  applyQuranFontToDOM(option.fontFamily);

  window.dispatchEvent(new CustomEvent(FONT_CHANGE_EVENT, { detail: { fontId, option } }));
}

export function applyQuranFontToDOM(fontFamily?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const font = fontFamily || getSelectedQuranFont().fontFamily;
  document.documentElement.style.setProperty('--quran-font-family', font);
}

export function subscribeQuranFont(callback: (font: QuranFontOption) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.option) {
      callback(custom.detail.option);
    } else {
      callback(getSelectedQuranFont());
    }
  };

  window.addEventListener(FONT_CHANGE_EVENT, handler);
  // Initial fire
  callback(getSelectedQuranFont());

  return () => {
    window.removeEventListener(FONT_CHANGE_EVENT, handler);
  };
}
