import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getAllCourses } from '../data/courses';

export interface TajweedRuleItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  unitId?: string; // الباب التجويدي التابع له الحكم إن وجد
  unitTitle?: string;
  courseId?: string; // الحقيبة التابع لها الحكم إن وجد
  condition: string;
  letters?: string;
  ruling: string; // الحكم الصوتي
  mechanism: string; // كيفية النطق / طريقة التطبيق
  examples: Array<{
    quranText: string;
    surahInfo?: string;
    explanation?: string;
  }>;
  importantNote?: string;
  evidenceMatn?: string; // الشاهد من التحفة أو الجزرية
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface CheatSheetCategory {
  id: string;
  label: string;
  icon: string;
  courseId?: string;
  unitId?: string;
  isCustom?: boolean;
}

const STORAGE_KEY = 'tajweed_custom_cheatsheet_rules_v2';

export const DEFAULT_CHEATSHEET_CATEGORIES: CheatSheetCategory[] = [
  { id: 'all', label: 'جميع الأحكام', icon: '✨' },
  { id: 'sakinan', label: 'التقاء الساكنين', icon: '🔗', courseId: 'sakinan' },
  { id: 'idgham', label: 'أحكام الإدغام', icon: '🔄', courseId: 'idgham' },
  { id: 'makharij_sifaat', label: 'المخارج والصفات', icon: '🎙️', courseId: 'makharij' },
  { id: 'noon_tanween', label: 'النون والتنوين', icon: '🌱' },
  { id: 'meem_sakinah', label: 'الميم الساكنة', icon: '💠' },
  { id: 'mudood', label: 'أحكام المدود', icon: '〰️' },
  { id: 'lam_raa', label: 'اللامات والراءات', icon: '⚖️' },
  { id: 'waqf_rasm', label: 'الوقف والرسم', icon: '📜' },
];

export const INITIAL_DEFAULT_RULES: TajweedRuleItem[] = [
  // 1. التقاء الساكنين
  {
    id: 'sakinan_kasr',
    title: 'التخلص من التقاء الساكنين بالكسر العارض',
    category: 'sakinan',
    categoryLabel: 'التقاء الساكنين',
    courseId: 'sakinan',
    unitTitle: 'الباب الثالث: التقاء الساكنين في كلمتين (المتحرك بالكسر)',
    condition: 'إذا التقى ساكنان بين كلمتين، وكان الساكن الأول حرفاً صحيحاً أو تنويناً، فالأصل عند العرب وحفص هو تحريكه بالكسر.',
    ruling: 'تحريك الساكن الأول بالكسر العارض وصلاً وسقوطه وقفاً.',
    mechanism: 'يُنطق الحرف الأول مكسوراً كسرة خفيفة دون مد، وتسقط همزة الوصل في الكلمة الثانية.',
    examples: [
      { quranText: 'قُلِ ادْعُوا اللَّهَ', surahInfo: 'الإسراء: 110', explanation: 'اللام في (قُل) ساكنة تحركت بالكسر لالتقائها مع الدال الساكنة.' },
      { quranText: 'قُلِ انظُرُوا', surahInfo: 'يونس: 101', explanation: 'كسر لام (قل) وصلاً للتخلص من التقاء الساكنين.' },
      { quranText: 'عَادًا الْأُولَىٰ', surahInfo: 'النجم: 50', explanation: 'تنوين (عاداً) ينطق نوناً ساكنة مكسورة وصلاً (عادَنِ الأولى).' },
      { quranText: 'أَنِ امْشُوا', surahInfo: 'ص: 6', explanation: 'نون (أن) الساكنة حُرّكت بالكسر وصلاً لالتقاء الساكنين.' },
    ],
    importantNote: 'الكسر هنا عارض لعلة التخلص من التقاء الساكنين فقط، ويزول عند الوقف بالرجوع للأصل وهو السكون.',
    evidenceMatn: 'وَإِنْ تَلَاقَى سَاكِنَانِ فَاحْذِفَا ... مَا كَانَ مَدًّا أَوْ فَحَرِّكْ بِالْخَفَا',
    tags: ['التقاء الساكنين', 'كسر عارض', 'تنوين', 'قل ادعوا', 'همزة وصل']
  },
  {
    id: 'sakinan_damm',
    title: 'التخلص من التقاء الساكنين بالضم العارض',
    category: 'sakinan',
    categoryLabel: 'التقاء الساكنين',
    courseId: 'sakinan',
    unitTitle: 'الباب الرابع: التقاء الساكنين في كلمتين (المتحرك بالفتح والضم)',
    condition: 'يُحرك الساكن الأول بالضم وجوباً في موضعين محددين: واو اللين الدالة على الجمع، وميم الجمع الساكنة.',
    ruling: 'تحريك الساكن الأول بالضم العارض وصلاً.',
    mechanism: 'ضم الشفتين ضماً محكماً عند نطق واو اللين أو ميم الجمع وصلاً، مع إسقاط همزة الوصل.',
    examples: [
      { quranText: 'فَتَمَنَّوُا الْمَوْتَ', surahInfo: 'البقرة: 94', explanation: 'ضُمّت واو الجماعة اللينة وصلاً للتخلص من التقاء الساكنين.' },
      { quranText: 'عَصَوُا وَّكَانُوا', surahInfo: 'البقرة: 61', explanation: 'ضُمّت واو الجماعة اللينة.' },
      { quranText: 'كُتِبَ عَلَيْكُمُ الْقِتَالُ', surahInfo: 'البقرة: 216', explanation: 'ميم الجمع الساكنة ضُمّت وصلاً.' },
      { quranText: 'لَهُمُ الْبُشْرَىٰ', surahInfo: 'يونس: 64', explanation: 'ميم الجمع تضم وصلاً دون مد صلة.' },
    ],
    importantNote: 'إذا كانت الواو حرف مد أصلي في الكلمة وليست واو لين (مثل: قَالُوا اتَّخَذَ) فإنها تُحذف لفظاً ولا تُضم.',
    evidenceMatn: 'وَضُمَّ فِي وَاوِ اشْتَرَوُا وَفِي مِيَمِ ... جَمْعٍ لِكُلِّ الْقُرَّاءِ ذِي الْكَرَمِ',
    tags: ['واو اللين', 'ميم الجمع', 'ضم عارض', 'تمنوا الموت', 'عليكم القتال']
  },
  {
    id: 'sakinan_fath',
    title: 'التخلص من التقاء الساكنين بالفتح العارض',
    category: 'sakinan',
    categoryLabel: 'التقاء الساكنين',
    courseId: 'sakinan',
    unitTitle: 'الباب الرابع: التقاء الساكنين في كلمتين (المتحرك بالفتح والضم)',
    condition: 'يُحرك الساكن الأول بالفتح العارض لخفة الفتحة في: نون (مِن) الجارة، وتاء التأنيث المتصلة بألف التثنية، وفاتحة آل عمران (الم * اللَّهُ).',
    ruling: 'تحريك الساكن بالفتح العارض وصلاً.',
    mechanism: 'فتح مخرج الحرف بخفة وسلاسة دون إطالة ولا توليد حرف مد.',
    examples: [
      { quranText: 'مِنَ الْمُؤْمِنِينَ', surahInfo: 'الأحزاب: 23', explanation: 'نون (مِن) الجارة فُتحت للتخلص من التقاء الساكنين.' },
      { quranText: 'قَالَتَا أَتَيْنَا طَائِعِينَ', surahInfo: 'فصلت: 11', explanation: 'أصلها (قالتْ) اتصلت بألف الاثنين ففُتحت التاء لمناسبة الألف.' },
      { quranText: 'الم ۚ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ', surahInfo: 'آل عمران: 1-2', explanation: 'تُقرأ وصلاً بفتح ميم (الم) مع القصر حركتين أو المد 6 حركات.' },
    ],
    importantNote: 'في (الم اللَّهُ) بآل عمران: الفتحة عارضة؛ فيجوز الاعتداد بها وقصر الميم حركتين، أو عدم الاعتداد ومد الميم 6 حركات وهو المقدم.',
    evidenceMatn: 'وَنُونَ مِنْ وَتَاءَ قَالَتَا افْتَحَا ... وَالمَ آلِ عِمْرَانَ الْتَحَى',
    tags: ['نون من الجارة', 'فتح عارض', 'الم الله', 'قالتا', 'آل عمران']
  },
  {
    id: 'sakinan_hadhf',
    title: 'التخلص من التقاء الساكنين بحذف حرف المد لفظاً',
    category: 'sakinan',
    categoryLabel: 'التقاء الساكنين',
    courseId: 'sakinan',
    unitTitle: 'الباب الخامس: الحذف والوقف والعارض',
    condition: 'إذا كان الساكن الأول حرف مد ولين (ألف، واو مدية، ياء مدية) وجاء بعده همزة وصل وساكن.',
    ruling: 'سقوط حرف المد لفظاً في الوصل وثبوته وقفاً.',
    mechanism: 'الانتقال المباشر من الحرف المحرك الذي يسبق حرف المد إلى الحرف الساكن في الكلمة الثانية دون أي مد.',
    examples: [
      { quranText: 'وَقَالَا الْحَمْدُ لِلَّهِ', surahInfo: 'النمل: 15', explanation: 'تسقط ألف التثنية وصلاً ويُنطق: (وقالَ لْحمدُ).' },
      { quranText: 'يُرِيدُونَ أَن يُطْفِئُوا نُورَ', surahInfo: 'التوبة: 32', explanation: 'تسقط واو الجماعة وصلاً عند التلاقي.' },
      { quranText: 'حَاضِرِي الْمَسْجِدِ الْحَرَامِ', surahInfo: 'البقرة: 196', explanation: 'تسقط الياء المدية وصلاً وتُنطق: (حاضِرِ لْمسجد).' },
      { quranText: 'فِي الْمَدِينَةِ', surahInfo: 'يوسف: 30', explanation: 'تسقط ياء (في) وصلاً وتُنطق: (فِ لْمدينة).' },
    ],
    importantNote: 'حرف المد محذوف لفظاً في الوصل فقط للتخلص من التقاء الساكنين، لكنه ثابت رسماً في المصحف ويثبت صوتاً عند الوقف الاختباري أو الاضطراري.',
    evidenceMatn: 'وَإِنْ تَلَاقَى سَاكِنَانِ فَاحْذِفَا ... مَا كَانَ مَدًّا فِي الْوِصَالِ مُوْقِفَا',
    tags: ['حذف حرف المد', 'وقال الحمد لله', 'في المدينة', 'سقوط الألف وصلا']
  },
  // 2. أحكام الإدغام
  {
    id: 'idgham_mithlayn',
    title: 'إدغام المثلين الصغير (المتماثلان)',
    category: 'idgham',
    categoryLabel: 'أحكام الإدغام',
    courseId: 'idgham',
    unitTitle: 'الباب الأول: إدغام المتماثلين (المثلين) وأقسامه واستثناءاته',
    condition: 'أن يتفق الحرفان مخرجاً وصفة، ويكون الحرف الأول ساكناً والثاني متحركاً.',
    ruling: 'وجوب الإدغام الكامل لجميع القراء، بغنة إن كان في الميم والنون، وبغير غنة في باقي الحروف.',
    mechanism: 'النطق بالحرف الثاني مشدداً تشديداً تاماً، وإعدام الحرف الأول بالكلية.',
    examples: [
      { quranText: 'قَد دَّخَلُوا', surahInfo: 'المائدة: 61', explanation: 'إدغام الدال في الدال بغير غنة.' },
      { quranText: 'اضْرِب بِّعَصَاكَ', surahInfo: 'البقرة: 60', explanation: 'إدغام الباء في الباء إدغاماً كاملاً.' },
      { quranText: 'وَقَد دَّخَلُوا بِالْكُفْرِ', surahInfo: 'المائدة: 61', explanation: 'إدغام الدال في الدال.' },
      { quranText: 'يُدْرِككُّمُ الْمَوْتُ', surahInfo: 'النساء: 78', explanation: 'إدغام الكاف الساكنة في الكاف المتحركة.' },
      { quranText: 'مَا لَكُم مِّنَ اللَّهِ', surahInfo: 'يونس: 27', explanation: 'إدغام الميم في الميم بغنة حركتين.' },
    ],
    importantNote: 'يُستثنى من الإدغام الصغير: واو المد نحو {آمَنُوا وَعَمِلُوا} وياء المد نحو {فِي يَوْمٍ} خوفاً من ذهاب المد بالكلية.',
    evidenceMatn: 'إِنْ فِي الصِّفَاتِ وَالمَخَارِجِ اتَّفَقْ ... حَرْفَانِ فَالْمِثْلاَنِ فِيهِمَا أَحَقْ',
    tags: ['إدغام مثلين', 'صغير', 'اضرب بعصاك', 'يدرككم', 'استثناء حرف المد']
  },
  {
    id: 'idgham_mutajanisayn_kamil',
    title: 'إدغام المتجانسين الكامل',
    category: 'idgham',
    categoryLabel: 'أحكام الإدغام',
    courseId: 'idgham',
    unitTitle: 'الباب الثاني: إدغام المتجانسين الصغير وأقسامه واستثناءاته',
    condition: 'حرفان اتفقا مخرجاً واختلفا في بعض الصفات، الأول ساكن والثاني متحرك، ويكون الحرف الأول أضعف من الثاني.',
    ruling: 'وجوب الإدغام الكامل؛ تسقط ذات الحرف الأول وجميع صفاته ويتحول للثاني مشدداً.',
    mechanism: 'النطق بالحرف الثاني مشدداً دون أي أثر لصوت الحرف الأول.',
    examples: [
      { quranText: 'أُجِيبَت دَّعْوَتُكُمَا', surahInfo: 'يونس: 89', explanation: 'إدغام التاء في الدال إدغاماً كاملاً: يُنطق (أجيبَدَّعوتكما).' },
      { quranText: 'أَثْقَلَت دَّعَوَا اللَّهَ', surahInfo: 'الأعراف: 189', explanation: 'إدغام التاء في الدال.' },
      { quranText: 'قَد تَّبَيَّنَ الرُّشْدُ', surahInfo: 'البقرة: 256', explanation: 'إدغام الدال في التاء: يُنطق (قتَّبيّن).' },
      { quranText: 'يَلْهَث ذَّٰلِكَ', surahInfo: 'الأعراف: 176', explanation: 'إدغام الثاء في الذال عند حفص وجوباً في الوصل.' },
      { quranText: 'ارْكَب مَّعَنَا', surahInfo: 'هود: 42', explanation: 'إدغام الباء في الميم بغنة كاملة لحفص وصلاً: (اركمَّعنا).' },
    ],
    importantNote: 'في {ارْكَب مَّعَنَا} و {يَلْهَث ذَّٰلِكَ} يجوز الوقف بالسكون والإظهار على الكلمة الأولى، والإدغام إنما يكون في الوصل.',
    evidenceMatn: 'وَإِنْ يَكُونَا مَخْرَجًا تَقَارَبَا ... وَفِي الصِّفَاتِ اخْتَلَفَا يُلَقَّبَا ... مُتَقَارِبَيْنِ أَوْ يَكُونَا اتَّفَقَا ... فِي مَخْرَجٍ دُونَ الصِّفَاتِ حُقِّقَا ... بِالْمُتَجَانِسَيْنِ',
    tags: ['متجانسين كامل', 'أجيبت دعوتكما', 'قد تبين', 'يلهث ذلك', 'اركب معنا']
  },
  {
    id: 'idgham_mutaqaribayn_qaf_kaf',
    title: 'إدغام المتقاربين (القاف في الكاف في نَخْلُقكُّم)',
    category: 'idgham',
    categoryLabel: 'أحكام الإدغام',
    courseId: 'idgham',
    unitTitle: 'الباب الثالث: إدغام المتقاربين الصغير ومواضع حفص الخمسة',
    condition: 'وقوع القاف الساكنة قبل الكاف في كلمة واحدة، وذلك في موضع واحد فقط في سورة المرسلات {أَلَمْ نَخْلُقكُّم}.',
    ruling: 'جواز الوجهين لحفص وعامة القراء: الإدغام الكامل (وهو المقدم في الأداء والمصحف)، والإدغام الناقص.',
    mechanism: 'في الكامل: كاف مشددة خالصة دون أي استعلاء. في الناقص: إطباق واستعلاء القاف دون قلقلة ثم كاف.',
    examples: [
      { quranText: 'أَلَمْ نَخْلُقكُّم مِّن مَّاءٍ مَّهِينٍ', surahInfo: 'المرسلات: 20', explanation: 'الوجه الأول: إدغام كامل (نخلُكُّم) وهو المقدم. الوجه الثاني: إدغام ناقص ببقاء استعلاء القاف.' },
    ],
    importantNote: 'في ضبط المصحف الشريف جُرّدت القاف من السكون وشُدّدت الكاف دلالة على تقديم وجه الإدغام الكامل.',
    evidenceMatn: 'وَالْخُلْفُ بِنَخْلُقكُّمْ وَقَعْ ... لِلْكُلِّ فِي الإِدْغَامِ حَيْثُ اسْتَمَعْ',
    tags: ['إدغام متقاربين', 'نخلقكم', 'المرسلات', 'كامل وناقص', 'وجهان']
  },
  // 3. المخارج والصفات
  {
    id: 'makhraj_jawf',
    title: 'مخرج الجوف وحروف المد الثلاثة',
    category: 'makharij_sifaat',
    categoryLabel: 'المخارج والصفات',
    courseId: 'makharij',
    unitTitle: 'الباب الأول: المخارج العامة والخاصة للحروف',
    condition: 'الجوف هو الخلاء الممتد داخل الحلق والفم، ويخرج منه حروف المد الثلاثة: الألف الساكنة المفتوح ما قبلها، والواو الساكنة المضموم ما قبلها، والياء الساكنة المكسور ما قبلها.',
    ruling: 'مخرج مقدّر (ليس له حيز محدد ينقطع عنده الصوت).',
    mechanism: 'جريان الصوت في التجويف الحلقي والشفوي حتى ينتهي مع انتهاء هواء الزفير دون انضغاط.',
    examples: [
      { quranText: 'نُوحِيهَا', surahInfo: 'هود: 49', explanation: 'جمعت حروف المد الثلاثة بشروطها: (نو: واو مد)، (حي: ياء مد)، (ها: ألف مد).' },
      { quranText: 'قَالَ', surahInfo: 'البقرة: 30', explanation: 'ألف مدية جوفية.' },
      { quranText: 'يَقُولُ', surahInfo: 'البقرة: 11', explanation: 'واو مدية جوفية.' },
      { quranText: 'قِيلَ', surahInfo: 'البقرة: 11', explanation: 'ياء مدية جوفية.' },
    ],
    importantNote: 'تسمى هذه الحروف: جوفية لخروجها من الجوف، وهوائية لأنها تنتهي بانقطاع الهواء، ومدية لقابليتها للامتداد.',
    evidenceMatn: 'فَأَلِفُ الْجَوْفِ وَأُخْتَاهَا وَهِي ... حُرُوفُ مَدٍّ لِلْهَوَاءِ تَنْتَهِي',
    tags: ['مخرج الجوف', 'حروف المد', 'نوحيها', 'مخرج مقدر']
  },
  {
    id: 'sifah_qalqalah',
    title: 'صفة القلقلة ومراتبها',
    category: 'makharij_sifaat',
    categoryLabel: 'المخارج والصفات',
    courseId: 'makharij',
    unitTitle: 'الباب الثاني: الصفات اللازمة للحروف وتطبيقاتها',
    condition: 'اضطراب المخرج عند النطق بالحرف الساكن حتى يسمع له نبرة قوية. حروفها خمسة مجموعة في: (قُطْبُ جَدٍّ).',
    ruling: 'صفة لازمة تظهر واضحة وقوية حال السكون.',
    mechanism: 'تباعد عضوي النطق فجأة دون أن يصاحبه شائبة حركة من الحركات الثلاث (لا فتح ولا كسر ولا ضم).',
    examples: [
      { quranText: 'وَتَبَّ', surahInfo: 'المسد: 1', explanation: 'قلقلة كبرى مشددة (أعلى المراتب عند الوقف على المشدد).' },
      { quranText: 'الْفَلَقِ', surahInfo: 'الفلق: 1', explanation: 'قلقلة كبرى مخففة (عند الوقف على الساكن غير المشدد).' },
      { quranText: 'يَطْمَعُ', surahInfo: 'المدثر: 15', explanation: 'قلقلة صغرى (في وسط الكلمة حال الوصل).' },
      { quranText: 'قَدْ أَفْلَحَ', surahInfo: 'المؤمنون: 1', explanation: 'قلقلة صغرى بين كلمتين في درج الكلام.' },
    ],
    importantNote: 'مراتب القلقلة: 1. أكبر: عند الوقف على حرف مشدد {وَتَبَّ}. 2. كبرى: عند الوقف على ساكن مخفف {الْفَلَقِ}. 3. صغرى: في الساكن الموصول {يَقْطَعُونَ}.',
    evidenceMatn: 'بَيِّنْ مُقَلْقَلًا إِنْ سَكَنَا ... وَإِنْ يَكُنْ فِي الْوَقْفِ كَانَ أَبْيَنَا ... وَقَلْقَلَةٌ قُطْبُ جَدٍّ',
    tags: ['قلقلة', 'قطب جد', 'مراتب القلقلة', 'الفلق', 'وتب']
  }
];

let cachedRules: TajweedRuleItem[] = [];
let isLoaded = false;
const listeners: Array<(rules: TajweedRuleItem[]) => void> = [];

export const getLocalCheatSheetRules = (): TajweedRuleItem[] => {
  if (isLoaded && cachedRules.length > 0) {
    return cachedRules;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedRules = parsed;
          isLoaded = true;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  cachedRules = [...INITIAL_DEFAULT_RULES];
  isLoaded = true;
  return cachedRules;
};

const saveLocalCheatSheetRules = (rules: TajweedRuleItem[]) => {
  cachedRules = rules;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch (e) {
      console.warn('LocalStorage save failed for cheatsheet rules', e);
    }
  }
  listeners.forEach((cb) => {
    try {
      cb(rules);
    } catch (e) {
      console.error('Error notifying cheatsheet listener:', e);
    }
  });
};

/**
 * Returns dynamic categories composed of both default categories and any courses/units added to the platform.
 */
export const getDynamicCategories = (): CheatSheetCategory[] => {
  const result: CheatSheetCategory[] = [...DEFAULT_CHEATSHEET_CATEGORIES];
  const allCourses = getAllCourses();

  allCourses.forEach((course) => {
    // Add course if not already present
    const exists = result.find((c) => c.id === course.id || c.courseId === course.id);
    if (!exists) {
      result.push({
        id: course.id,
        label: course.title,
        icon: '📚',
        courseId: course.id,
        isCustom: true,
      });
    }

    // Add each unit (باب) as a subcategory!
    if (course.units && course.units.length > 0) {
      course.units.forEach((unit) => {
        const unitCatId = `unit_${course.id}_${unit.id || unit.unitNumber}`;
        const unitExists = result.find((c) => c.id === unitCatId);
        if (!unitExists) {
          result.push({
            id: unitCatId,
            label: `${unit.title} (${course.shortTitle || course.title})`,
            icon: '🔖',
            courseId: course.id,
            unitId: unit.id || String(unit.unitNumber),
            isCustom: true,
          });
        }
      });
    }
  });

  return result;
};

/**
 * Subscribe to rules changes (Firestore + Local)
 */
export const subscribeCheatSheetRules = (callback: (rules: TajweedRuleItem[]) => void) => {
  listeners.push(callback);
  callback(getLocalCheatSheetRules());

  try {
    const colRef = collection(db, 'tajweed_cheatsheet_rules');
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (!snap.empty) {
          const list: TajweedRuleItem[] = [];
          snap.forEach((d) => {
            const data = d.data() as TajweedRuleItem;
            list.push({ ...data, id: d.id });
          });
          // sort by updatedAt desc or default order
          list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          saveLocalCheatSheetRules(list);
        } else {
          // If firestore is empty, seed defaults
          const current = getLocalCheatSheetRules();
          if (current.length > 0) {
            current.forEach((r) => {
              setDoc(doc(db, 'tajweed_cheatsheet_rules', r.id), r).catch(() => {});
            });
          }
        }
      },
      (err) => {
        console.warn('Firestore cheatsheet subscription notice:', err.message);
      }
    );

    return () => {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
      unsub();
    };
  } catch (e) {
    console.warn('Firestore not available for cheatsheet:', e);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }
};

/**
 * Save or update a single rule
 */
export const saveCheatSheetRule = async (rule: TajweedRuleItem): Promise<{ success: boolean; error?: string }> => {
  try {
    const current = getLocalCheatSheetRules();
    const cleanId = rule.id?.trim() || `rule_${Date.now()}`;
    const now = Date.now();
    const updatedRule: TajweedRuleItem = {
      ...rule,
      id: cleanId,
      updatedAt: now,
      createdAt: rule.createdAt || now,
    };

    const existsIdx = current.findIndex((r) => r.id === cleanId);
    let nextList: TajweedRuleItem[];
    if (existsIdx !== -1) {
      nextList = [...current];
      nextList[existsIdx] = updatedRule;
    } else {
      nextList = [updatedRule, ...current];
    }

    saveLocalCheatSheetRules(nextList);

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'tajweed_cheatsheet_rules', cleanId), updatedRule);
    } catch (e) {
      console.warn('Firestore save warning for rule:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل حفظ الحكم' };
  }
};

/**
 * Delete a rule
 */
export const deleteCheatSheetRule = async (ruleId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const current = getLocalCheatSheetRules();
    const nextList = current.filter((r) => r.id !== ruleId);
    saveLocalCheatSheetRules(nextList);

    try {
      await deleteDoc(doc(db, 'tajweed_cheatsheet_rules', ruleId));
    } catch (e) {
      console.warn('Firestore delete warning for rule:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل حذف الحكم' };
  }
};

/**
 * Reset to defaults
 */
export const resetCheatSheetRulesToDefault = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    saveLocalCheatSheetRules([...INITIAL_DEFAULT_RULES]);
    // Clear and re-seed Firestore
    try {
      const snap = await getDocs(collection(db, 'tajweed_cheatsheet_rules'));
      const delPromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(delPromises);

      const seedPromises = INITIAL_DEFAULT_RULES.map((r) =>
        setDoc(doc(db, 'tajweed_cheatsheet_rules', r.id), r)
      );
      await Promise.all(seedPromises);
    } catch (e) {
      console.warn('Firestore reset warning:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل استعادة الأحكام الافتراضية' };
  }
};
