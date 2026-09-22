import React, { useState } from 'react';
import { 
  Sparkles, Layers, Activity, Volume2, ShieldAlert, 
  CheckCircle2, ArrowRightLeft, Eye, RefreshCw, Flame,
  Wind
} from 'lucide-react';

export interface SifahDetail {
  id: string;
  name: string;
  opposite?: string;
  category: 'opposed' | 'non_opposed';
  letters: string;
  shortDescription: string;
  vocalCordsState: {
    stateName: string;
    diagramType: 'open_quiet' | 'closed_vibrating' | 'tight_lock' | 'partial_flow';
    description: string;
    airflow: 'continuous' | 'blocked' | 'partial';
    vibration: 'none' | 'intense' | 'moderate';
  };
  tongueState: {
    stateName: string;
    shape: 'elevated_back' | 'depressed_flat' | 'adhered_roof' | 'separated_open' | 'extended_forward' | 'trembling_tip' | 'deflected_sides' | 'dispersed_middle';
    description: string;
    resonance: string;
  };
  scholarlyWisdom: string;
  commonMistakes: string;
  quranicExample: { word: string; verse: string; surah: string };
}

export const SIFAAT_FULL_LIST: SifahDetail[] = [
  // 1. الهمس
  {
    id: 's-hams',
    name: 'صِفَةُ الهَمْس',
    opposite: 'الجَهْر',
    category: 'opposed',
    letters: 'فَحَثَّهُ شَخْصٌ سَكَتْ (10 أحرف)',
    shortDescription: 'جريان نَفَسِ الهواء عند النطق بالحرف لضعف الاعتماد على المخرج وانفتاح الأوتار الصوتية.',
    vocalCordsState: {
      stateName: 'أوتار صوتية متباعدة ومفتوحة تماماً (فتحة المزمار واسعة)',
      diagramType: 'open_quiet',
      description: 'تتباعد الأوتار الصوتية في الحنجرة ولا تهتز، مما يسمح لهواء الرئتين بالتدفق بحرية ودون ممانعة، فيخرج النفس مصاحباً لصوت الحرف.',
      airflow: 'continuous',
      vibration: 'none'
    },
    tongueState: {
      stateName: 'اعتماد ضعيف على مخرج الحرف',
      shape: 'separated_open',
      description: 'لا يضغط اللسان بقوة على موضع التماس، بل يلامس المخرج برفق ليتسنى للنفس الخروج.',
      resonance: 'صوت رخيم خافت غير رنان يغلب عليه هواء الزفير.'
    },
    scholarlyWisdom: 'الهمس صفة ضعف ناشئة عن عدم اهتزاز الأوتار الصوتية، وأقوى حروف الهمس هو الصاد لما فيه من استعلاء وإطباق وصفير.',
    commonMistakes: 'حبس النفس في الكاف والتاء الساكنتين فتتحولان لحروف ميتة مطموسة، أو إهمال همس السين والفاء.',
    quranicExample: { word: 'سَكَتَ', verse: 'وَلَمَّا سَكَتَ عَنْ مُوسَى الْغَضَبُ', surah: 'الأعراف: 154' }
  },

  // 2. الجهر
  {
    id: 's-jahr',
    name: 'صِفَةُ الجَهْر',
    opposite: 'الهَمْس',
    category: 'opposed',
    letters: 'باقي أحرف الهجاء (19 حرفاً: ع، ظ، م، و، ز، ن، ق، ا، ر، ئ، ذ، ي، غ، ض، ج، د، ط، ل، ب)',
    shortDescription: 'انحباس جريان النفس لقوة الاعتماد على المخرج وتقارب الأوتار الصوتية واهتزازها الشديد.',
    vocalCordsState: {
      stateName: 'أوتار صوتية متقاربة وتتذبذب بسرعة هائلة',
      diagramType: 'closed_vibrating',
      description: 'تنغلق الأوتار الصوتية وتنفتح بذبذبات سريعة ومتلاحقة تحت ضغط هواء الرئتين، مما يمنع تسرب النفس الحر ويولد صوتاً مجهوراً ناصعاً.',
      airflow: 'blocked',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'اعتماد قوي محكم على المخرج',
      shape: 'elevated_back',
      description: 'يضغط عضو النطق بقوة على الموضع المحقق، مانعاً أي تسرب للنفس الحر.',
      resonance: 'صوت قوي مجهور ذو رنين وتذبذب حنجري مسموع.'
    },
    scholarlyWisdom: 'الجهر صفة قوة، وحروف الجهر كلها تكتسب رنينها من تذبذب واهتزاز الوترين الصوتيين في الحنجرة.',
    commonMistakes: 'خلط الجهر بالهمس في حرف الزاي (فتتحول لسِين) أو في الجيم (فتتحول لشِين) أو في الذال (فتتحول لثَاء).',
    quranicExample: { word: 'الذِّكْرَ', verse: 'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ', surah: 'الحجر: 9' }
  },

  // 3. الشدة
  {
    id: 's-shiddah',
    name: 'صِفَةُ الشِّدَّة',
    opposite: 'الرَّخَاوة والبَيْنيَّة',
    category: 'opposed',
    letters: 'أَجِدُ قَطٍ بَكَتْ (8 أحرف)',
    shortDescription: 'انحباس جريان الصوت انحباساً تاماً عند النطق بالحرف لكمال قوة الاعتماد على المخرج.',
    vocalCordsState: {
      stateName: 'انطباق كامل ومحكم لعضوي النطق مانعاً للصوت',
      diagramType: 'tight_lock',
      description: 'يحدث انغلاق تام وحاجز مطلق في المخرج، فيتوقف الصوت خلفه تماماً لحظة النطق، ولا يخرج الحرف الساكن إلا بالقلقلة (في قطب جد) أو بالهمس (في الكاف والتاء).',
      airflow: 'blocked',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'التصاق قاطع في موضع التماس',
      shape: 'adhered_roof',
      description: 'يلتصق طرف اللسان أو أقصاه التواءً وإحكاماً تاماً بالحنك، مانعاً أي منفذ لمرور ذرة صوت واحدة.',
      resonance: 'انقطاع فوري قاطع للصوت لا يقبل التمطيط إطلاقاً.'
    },
    scholarlyWisdom: 'الشدة تعني انحباس الصوت، بينما الجهر يعني انحباس النفس. فالهمزة شديدة مجهورة، والكاف شديدة مهموسة.',
    commonMistakes: 'مط صوت الحرف الشديد أو ترخيته فيتحول إلى رخو (كنطق الجيم رخوة شامية أو فرنسية).',
    quranicExample: { word: 'أَجِدُ', verse: 'قُلْ لَا أَجِدُ فِي مَا أُوحِيَ إِلَيَّ', surah: 'الأنعام: 145' }
  },

  // 4. الرخاوة
  {
    id: 's-rakhawah',
    name: 'صِفَةُ الرَّخَاوَة',
    opposite: 'الشِّدَّة',
    category: 'opposed',
    letters: '16 حرفاً (ما عدا حروف الشدة أجد قط بكت وحروف التوسط لن عمر)',
    shortDescription: 'جريان الصوت التام عند النطق بالحرف لضعف الاعتماد على المخرج وتجافي العضوين.',
    vocalCordsState: {
      stateName: 'مجرى صوتي رخو ومستمر',
      diagramType: 'open_quiet',
      description: 'لا ينغلق المخرج انغلاقاً تاماً، بل يبقى مجرى واسع يمر منه الصوت الرخو ممتداً بقدر حركة القارئ.',
      airflow: 'continuous',
      vibration: 'moderate'
    },
    tongueState: {
      stateName: 'تجافٍ وتجاوز في المخرج',
      shape: 'separated_open',
      description: 'يبقى اللسان متجافياً عن سقف الفم، فيتدفق الصوت في الممر بسلاسة.',
      resonance: 'صوت ممتد زمني متصل يقبل الجريان.'
    },
    scholarlyWisdom: 'زمن الحرف الرخو الساكن أطول من زمن الحرف البيني، وزمن البيني أطول من زمن الشديد في الميزان النبري للآيات.',
    commonMistakes: 'بتر صوت الحرف الرخو الساكن كالصاد والشين والذال في نحو: ﴿يَسْتَبْشِرُونَ﴾.',
    quranicExample: { word: 'يَسْتَبْشِرُونَ', verse: 'يَسْتَبْشِرُونَ بِنِعْمَةٍ مِنَ اللَّهِ', surah: 'آل عمران: 171' }
  },

  // 5. التوسط (البينية)
  {
    id: 's-tawassut',
    name: 'صِفَةُ التَّوَسُّط (البَيْنيَّة)',
    opposite: 'الشدة والرخاوة',
    category: 'opposed',
    letters: 'لِنْ عُمَرْ (5 أحرف: ل، ن، ع، م، ر)',
    shortDescription: 'اعتدال الصوت وجريانه جزئياً لعدم كمال انحباسه كما في الشدة، وعدم كمال جريانه كما في الرخاوة.',
    vocalCordsState: {
      stateName: 'جريان جزئي متحول للصوت',
      diagramType: 'partial_flow',
      description: 'ينسد مخرج الصوت جزئياً، فيتحول مسار الصوت إلى منفذ آخر: في النون والميم إلى الخيشوم، وفي اللام إلى جانبي اللسان، وفي الراء بارتعادة اللسان، وفي العين برجوع لسان المزمار دون غلق.',
      airflow: 'partial',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'توازن بين الالتصاق والمجرى المفتوح',
      shape: 'deflected_sides',
      description: 'اللام ينغلق طرف اللسان وينحرف الصوت للجانبين؛ النون ينغلق الفم وينفتح الخيشوم؛ الراء يرتعد الرأس بلطف.',
      resonance: 'زمن صوتي معتدل وسط بين قصر الشديد وطول الرخو.'
    },
    scholarlyWisdom: 'علة البينية تختلف في كل حرف: في النون والميم لاشتراك الفم والخيشوم، وفي اللام والراء للانحراف، وفي العين لعدم انغلاق لسان المزمار بالكامل.',
    commonMistakes: 'قلقلة حروف لن عمر عند السكون أو المبالغة في زمنها فتقارب الرخوة.',
    quranicExample: { word: 'الْعَالَمِينَ', verse: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', surah: 'الفاتحة: 2' }
  },

  // 6. الاستعلاء
  {
    id: 's-isti3la',
    name: 'صِفَةُ الاسْتِعْلَاء (التفخيم المستمر)',
    opposite: 'الاسْتِفَال',
    category: 'opposed',
    letters: 'خُصَّ ضَغْطٍ قِظْ (7 أحرف)',
    shortDescription: 'تصعد وضغط الصوت نحو قبة الحنك الأعلى عند النطق بالحرف نتيجة ارتفاع أقصى اللسان.',
    vocalCordsState: {
      stateName: 'توجيه مباشر للصدى الصوتي إلى قبة الغار',
      diagramType: 'closed_vibrating',
      description: 'ينطلق الصوت من الحنجرة ويتصعد رأساً إلى تجويف قبة الحنك الأعلى فيرتطم بها صانعاً صدى غليظاً يملأ الفم.',
      airflow: 'blocked',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'ارتفاع وتقبيب أقصى اللسان',
      shape: 'elevated_back',
      description: 'يرتفع أقصى اللسان (مما يلي الحلق) ارتفاعاً حاسماً نحو سقف الفم اللحمي، فيتضيق البلعوم ويتجه الصوت لأعلى.',
      resonance: 'تفخيم وتغليظ صوتي فخم يملأ الفم برنينه وضخامته.'
    },
    scholarlyWisdom: 'حروف الاستعلاء السبعة مفخمة دائماً، وأقواها المطبقة الأربعة (ط، ض، ص، ظ) لجمعها بين الاستعلاء والإطباق.',
    commonMistakes: 'ضم الشفتين عند تفخيم حروف الاستعلاء ظناً أن التفخيم يصنع بالشفتين، بينما التفخيم مصدره ارتفاع أقصى اللسان وتجويف الفم.',
    quranicExample: { word: 'خَالِدِينَ', verse: 'خَالِدِينَ فِيهَا أَبَداً', surah: 'النساء: 57' }
  },

  // 7. الاستفال
  {
    id: 's-istifal',
    name: 'صِفَةُ الاسْتِفَال (الترقيق الأصلي)',
    opposite: 'الاسْتِعْلَاء',
    category: 'opposed',
    letters: 'باقي أحرف الهجاء (22 حرفاً)',
    shortDescription: 'انخفاض وتسفل اللسان واستقراره في قاع الفم وتسفل الصوت وعدم تصعده للحنك.',
    vocalCordsState: {
      stateName: 'جريان الصوت في استواء أفقي مستفل',
      diagramType: 'open_quiet',
      description: 'يمر الصوت في مجرى أفقي مستقيم نحو خارج الفم دون أن يصطدم بقبة الحنك الأعلى.',
      airflow: 'continuous',
      vibration: 'moderate'
    },
    tongueState: {
      stateName: 'انخفاض وتسفل أقصى اللسان في قاع الفم',
      shape: 'depressed_flat',
      description: 'يستقر أقصى اللسان وجسمه في قاع الفم منبسطاً مستفلاً، مما يمنع انحصار الصوت.',
      resonance: 'ترقيق نحيف رقيق خفيف على اللسان والسمع.'
    },
    scholarlyWisdom: 'أصل حروف الاستفال الترقيق، ما عدا (الألف، واللام في اسم الجلالة، والراء) فإنها تفخم في أحوال وترقق في أحوال.',
    commonMistakes: 'تفخيم الحرف المستفل لمجاورته حرفاً مستعلياً: كالباء في ﴿بَاطِلاً﴾ أو الهمزة في ﴿اللَّهِ﴾.',
    quranicExample: { word: 'بِسْمِ', verse: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', surah: 'الفاتحة: 1' }
  },

  // 8. الإطباق
  {
    id: 's-itbaq',
    name: 'صِفَةُ الإِطْبَاق (أعلى درجات القوة)',
    opposite: 'الانْفِتَاح',
    category: 'opposed',
    letters: 'ص، ض، ط، ظ (4 أحرف)',
    shortDescription: 'تلاصق وتطابق جملة اللسان مع الحنك الأعلى وانحصار الصوت انحصاراً شديداً بينهما.',
    vocalCordsState: {
      stateName: 'انحصار صوتي مكتوم وشديد القوة',
      diagramType: 'tight_lock',
      description: 'يتراكم الصوت المحصور في فراغ ضيق جداً بين ظهر اللسان وقبة الحنك الأعلى فيحدث رنيناً استعلائياً فائق القوة.',
      airflow: 'blocked',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'انطباق ومحاذاة تامة لمعظم اللسان مع قبة الحنك',
      shape: 'adhered_roof',
      description: 'يرتفع أقصى اللسان ووسطه وطرفه معاً ليحاذي سقف الحنك الأعلى محاذاة تكاد تطبق الفراغ بالكامل.',
      resonance: 'أعلى وأضخم مراتب التفخيم في اللغة العربية على الإطلاق.'
    },
    scholarlyWisdom: 'كل حرف مطبق هو مستعلٍ حتماً، ولكن ليس كل مستعلٍ مطبقاً (كالقاف والغين والخاء فهي مستعلية منفتحة).',
    commonMistakes: 'إضعاف إطباق الطاء فتخرج كتاء مفخمة، أو إضعاف إطباق الصاد فتصير كالسين.',
    quranicExample: { word: 'الصِّرَاطَ', verse: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', surah: 'الفاتحة: 6' }
  },

  // 9. الانفتاح
  {
    id: 's-infitah',
    name: 'صِفَةُ الانْفِتَاح',
    opposite: 'الإِطْبَاق',
    category: 'opposed',
    letters: '25 حرفاً (كل الحروف ما عدا ص، ض، ط، ظ)',
    shortDescription: 'انفتاح وتجافٍ ما بين اللسان وسقف الحنك الأعلى وخروج الريح والصوت دون انحصار.',
    vocalCordsState: {
      stateName: 'مجرى صوتي فسيح منفتح',
      diagramType: 'open_quiet',
      description: 'ينطلق الصوت في الفضاء المفتوح بين اللسان وسقف الفم دون حبس بين صفحة اللسان والحنك.',
      airflow: 'continuous',
      vibration: 'moderate'
    },
    tongueState: {
      stateName: 'تجافٍ تام بين اللسان والحنك',
      shape: 'separated_open',
      description: 'يتجافى وسط اللسان عن سقف الفم فيخرج الصوت في سعة وانفتاح.',
      resonance: 'صوت متحرر غير محصور في سقف الفم.'
    },
    scholarlyWisdom: 'حروف الانفتاح تضم كل الحروف المرققة، وتضم أيضاً ثلاثة أحرف مفخمة مستعلية (ق، غ، خ) وتسمى المستعلية المنفتحة.',
    commonMistakes: 'المبالغة في فتح الفم شاقولياً في حروف الانفتاح المكسورة فتخرج كالممالة.',
    quranicExample: { word: 'كِتَابٌ', verse: 'كِتَابٌ أَنْزَلْنَاهُ إِلَيْكَ مُبَارَكٌ', surah: 'ص: 29' }
  },

  // 10. القلقلة
  {
    id: 's-qalqalah',
    name: 'صِفَةُ القَلْقَلَة',
    category: 'non_opposed',
    letters: 'قُطْبُ جَدٍّ (5 أحرف)',
    shortDescription: 'اضطراب وتحريك المخرج عند النطق بالحرف ساكناً حتى يسمع له نبرة قوية دون شائبة حركة.',
    vocalCordsState: {
      stateName: 'انغلاق شديد مجهور يعقبه تباعد سريع مفاجئ',
      diagramType: 'tight_lock',
      description: 'ينغلق المخرج التماسياً بقوة (شدة وجهر)، فتحتبس الأوتار والصوت تماماً، ثم ينفك المخرج انفصالاً سريعاً ومفاجئاً دون تحريك الشفتين أو الفك.',
      airflow: 'blocked',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'ارتداد سريع لعضوي النطق',
      shape: 'elevated_back',
      description: 'يصطدم العضوان في المخرج ثم يتباعدان بارتداد مرن يسمح بانفلات الصوت المحبوس بنبرة صافية.',
      resonance: 'نبرة صوتية حادة مميزة تملأ الأذن بياناً.'
    },
    scholarlyWisdom: 'مراتب القلقلة: 1. كبرى عند الوقف على المشدد ﴿وَتَبَّ﴾، 2. وسطى عند الوقف على المخفف ﴿الْفَلَقِ﴾، 3. صغرى في وسط الكلمة ﴿يَطْمَعُ﴾.',
    commonMistakes: 'خلط صوت القلقلة بحركة كفتحة أو كسرة، أو ختم القلقلة بهمزة مقفولة.',
    quranicExample: { word: 'الْفَلَقِ', verse: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', surah: 'الفلق: 1' }
  },

  // 11. الاستطالة
  {
    id: 's-istitatah',
    name: 'صِفَةُ الاسْتِطَالَة (خاصة بحرف الضاد)',
    category: 'non_opposed',
    letters: 'حرف الضاد وحده (ض)',
    shortDescription: 'امتداد الصوت والمخرج من أول إحدى حافتي اللسان إلى آخرها حتى يتصل بمخرج اللام تحت ضغط الهواء.',
    vocalCordsState: {
      stateName: 'ضغط هوائي متواصل واهتزاز مجهور',
      diagramType: 'closed_vibrating',
      description: 'يتراكم هواء الزفير خلف اللسان الملتصق بالأضراس، فيندفع اللسان للأمام تدريجياً في ممر حافة اللسان.',
      airflow: 'blocked',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'اندفاع تدريجي لحافة اللسان للأمام',
      shape: 'extended_forward',
      description: 'تلتصق حافة اللسان بالأضراس العليا، ثم يمتد اللسان زاحفاً إلى الأمام تحت تأثير ضغط الهواء الصاعد من الحلق حتى يلامس طرفه مخرج اللام.',
      resonance: 'صوت رخو ممتد زمني مستطيل لا ينقطع فجأة ولا يقلقل.'
    },
    scholarlyWisdom: 'الاستطالة صفة ملازمة للضاد تميزها عن الظاء؛ فالضاد مخرجها حافة اللسان وتستطيل، بينما الظاء مخرجها طرف اللسان ولا استطالة فيها.',
    commonMistakes: 'قلقلة الضاد أو إخراج اللسان بين الأسنان فتصير ظاءً، أو ضرب الطرف بأصول الثنايا فتصير دالاً مفخمة.',
    quranicExample: { word: 'الْمَغْضُوبِ', verse: 'غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', surah: 'الفاتحة: 7' }
  },

  // 12. الصفير
  {
    id: 's-safeer',
    name: 'صِفَةُ الصَّفِير',
    category: 'non_opposed',
    letters: 'الصاد، والزاي، والسين (ص - ز - س)',
    shortDescription: 'صوت زائد حاد يخرج من بين الشفتين وفوق الثنايا السفلى يشبه صفير الطائر لضيق مجرى الهواء.',
    vocalCordsState: {
      stateName: 'تيار هوائي نفاث ومضغوط',
      diagramType: 'open_quiet',
      description: 'يندفع الهواء عبر ممر ضيق جداً بين طرف اللسان وصفحة الثنايا السفلى فيحدث رنيناً صفيرياً حاداً.',
      airflow: 'continuous',
      vibration: 'moderate'
    },
    tongueState: {
      stateName: 'اقتراب أسلة اللسان من الثنايا السفلى',
      shape: 'separated_open',
      description: 'يقترب رأس اللسان المستدق من صفحة الثنايا السفلى دون التصاق تام صانعاً مجرى نفاثاً كالفوهة.',
      resonance: 'صوت رنان يشبه صفير الشحرور في الصاد، والجراد في الزاي، وطنين النحل في السين.'
    },
    scholarlyWisdom: 'ترتيب الصفير في القوة: أقواها الصاد لإطباقها واستعلائها، ثم الزاي لجهرها، ثم السين لهمسها واستفالها.',
    commonMistakes: 'إخراج اللسان بين الأسنان عند نطق السين فتتحول لثاء (الثأثأة)، أو ضم الشفتين في الصاد.',
    quranicExample: { word: 'الصَّادِقِينَ', verse: 'وَكُونُوا مَعَ الصَّادِقِينَ', surah: 'التوبة: 119' }
  },

  // 13. التفشي
  {
    id: 's-tafashshi',
    name: 'صِفَةُ التَّفَشِّي (خاصة بالشين)',
    category: 'non_opposed',
    letters: 'حرف الشين وحده (ش)',
    shortDescription: 'انتشار الريح والنفس في الفم بين وسط اللسان وسقف الحنك حتى يصل للأسنان عند النطق بالحرف.',
    vocalCordsState: {
      stateName: 'أوتار متباعدة وتدفق واسع للهواء',
      diagramType: 'open_quiet',
      description: 'تتباعد الأوتار الصوتية في الحنجرة تماماً، فيتدفق هواء النفس بغزارة دون اهتزاز.',
      airflow: 'continuous',
      vibration: 'none'
    },
    tongueState: {
      stateName: 'ارتفاع وتجافٍ لوسط اللسان',
      shape: 'dispersed_middle',
      description: 'يرتفع وسط اللسان نحو الحنك الصلب مع بقاء مساحة واسعة ينتشر فيها تيار الهواء المتدفق في أرجاء الفم الداخلية.',
      resonance: 'صوت هسيس ناعم منتشر في فناء الفم كاملاً.'
    },
    scholarlyWisdom: 'أعلى درجات التفشي تكون في الشين المشددة نحو: ﴿الشَّمْسِ﴾، ثم الساكنة ﴿يَشْتَرُونَ﴾، ثم المتحركة ﴿شَهِيداً﴾.',
    commonMistakes: 'حبس صوت الشين أو تفخيمها إذا جاورت مفخماً نحو: ﴿شَطَطاً﴾ أو قصر زمن جريانها.',
    quranicExample: { word: 'الشَّمْسُ', verse: 'الشَّمْسُ وَالْقَمَرُ بِحُسْبَانٍ', surah: 'الرحمن: 5' }
  },

  // 14. الانحراف
  {
    id: 's-inhiraf',
    name: 'صِفَةُ الانْحِرَاف',
    category: 'non_opposed',
    letters: 'اللام والراء (ل - ر)',
    shortDescription: 'ميل صوت الحرف بعد خروجه من مخرجه لعدم استقامة مساره لانسداد بعض المخرج بعضو النطق.',
    vocalCordsState: {
      stateName: 'اهتزاز مجهور وتوسط صوتي',
      diagramType: 'partial_flow',
      description: 'تهتز الأوتار الصوتية في الحنجرة، ويتوجه الصوت نحو الفم فيصطدم بحاجز جزئي فيميل وينحرف مساره.',
      airflow: 'partial',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'تحويل مسار الهواء الصوتي',
      shape: 'deflected_sides',
      description: 'في اللام: ينحرف الصوت من وسط اللسان لانسداده بالطرف نحو الحافتين. في الراء: ينحرف الصوت من الحافتين نحو وسط ظهر اللسان.',
      resonance: 'جريان بيني فريد يوازن بين الانحباس والجريان.'
    },
    scholarlyWisdom: 'انحراف اللام والراء يعلل إدراجهما في حروف التوسط (البينية) لأن الصوت يجد منفذاً جانبياً للانسياب.',
    commonMistakes: 'حبس صوت اللام تماماً ومنع انحرافه الطبيعي، أو تفخيم لام ﴿جَعَلْنَا﴾.',
    quranicExample: { word: 'الْحَمْدُ', verse: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', surah: 'الفاتحة: 2' }
  },

  // 15. التكرير
  {
    id: 's-takreer',
    name: 'صِفَةُ التَّكْرِير (خاصة بالراء)',
    category: 'non_opposed',
    letters: 'حرف الراء وحده (ر)',
    shortDescription: 'ارتعاد لطيف لرأس اللسان عند النطق بالحرف، وهي صفة تُعرف لكي تُجتنب وتُضبط بارتعادة واحدة خفيفة.',
    vocalCordsState: {
      stateName: 'نبضات تذبذبية مجهورة سريعة',
      diagramType: 'closed_vibrating',
      description: 'الأوتار الصوتية متقاربة وتهتز، ويتدفق الصوت صاعداً لرأس اللسان فيحدث ارتعاداً دقيقاً في مجرى الهواء.',
      airflow: 'partial',
      vibration: 'intense'
    },
    tongueState: {
      stateName: 'ارتعاد رأس اللسان ارتعادة واحدة مضبوطة',
      shape: 'trembling_tip',
      description: 'يرتعد طرف اللسان برفق لملامسة لثة الثنايا العليا ملامسة واحدة لطيفة، مع تثبيت جانبي اللسان لمنع تعدد الارتعادات.',
      resonance: 'رنين بيني مضبوط ومحكوم دون مبالغة.'
    },
    scholarlyWisdom: 'قال الإمام ابن الجزري: (وَأَخْفِ تَكْرِيراً إِذَا تُشَدَّدُ)؛ فالتحذير من إظهار راءات متعددة شنيعة كمن يقول (الرررررحمن).',
    commonMistakes: 'المبالغة في الارتعاد وتكرار الراء عدة مرات خاصة عند تشديدها أو الوقف عليها.',
    quranicExample: { word: 'الرَّحِيمِ', verse: 'الرَّحْمَنِ الرَّحِيمِ', surah: 'الفاتحة: 3' }
  }
];

export const SifaatVocalSimulator: React.FC = () => {
  const [selectedSifahId, setSelectedSifahId] = useState<string>('s-hams');
  const [activeTab, setActiveTab] = useState<'details' | 'compare_vocal' | 'compare_tongue'>('details');

  const activeSifah = SIFAAT_FULL_LIST.find(s => s.id === selectedSifahId) || SIFAAT_FULL_LIST[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full font-quran shadow-sm">
                مختبر الأوتار واللسان التفاعلي
              </span>
              <span className="text-indigo-300 text-xs font-bold font-quran">
                ميكانيكا النطق الصوتي لصفات الحروف
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-quran text-amber-300 leading-snug">
              محاكي حركة الأوتار الصوتية واللسان مع كل صفة تجويدية
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              شاهد بالرسوم التشريحية والشروحات الصوتية الدقيقة كيف تنفتح وتنغلق الأوتار الصوتية وتهتز، وكيف يتشكل اللسان (استعلاءً، إطباقاً، استطالةً، وتكوفاً) مع كل صفة من الصفات.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer ${
                activeTab === 'details' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              عرض الصفات الفردية
            </button>
            <button
              onClick={() => setActiveTab('compare_vocal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer ${
                activeTab === 'compare_vocal' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              مقارنة الأوتار (الهمس والجهر)
            </button>
            <button
              onClick={() => setActiveTab('compare_tongue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer ${
                activeTab === 'compare_tongue' ? 'bg-emerald-700 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              مقارنة اللسان (الاستعلاء والإطباق)
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Individual Sifah Inspector */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sifaat Selector Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2 max-h-[780px] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 px-2 pb-1 uppercase tracking-wider font-quran border-b border-slate-100 flex items-center justify-between">
              <span>فهرس صفات الحروف ({SIFAAT_FULL_LIST.length})</span>
              <span className="text-indigo-600">اختر صفة</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {SIFAAT_FULL_LIST.map((s) => {
                const isSelected = s.id === selectedSifahId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSifahId(s.id)}
                    className={`w-full text-right p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                      isSelected
                        ? 'bg-indigo-950 text-white border-indigo-700 shadow-md'
                        : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-800 border-slate-200/70'
                    }`}
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-400'}`} />
                        <span className={`text-xs font-black font-quran leading-snug ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                          {s.name}
                        </span>
                      </div>
                      <div className={`text-[11px] pr-4 line-clamp-1 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {s.letters}
                      </div>
                    </div>
                    {s.opposite && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold font-quran shrink-0 ${
                        isSelected ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-200 text-slate-600'
                      }`}>
                        ضدها: {s.opposite}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Sifah Simulation & Anatomical Display */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="bg-indigo-100 text-indigo-950 text-xs font-black px-3 py-1 rounded-full font-quran border border-indigo-200">
                  {activeSifah.category === 'opposed' ? 'صفة ذات ضد' : 'صفة لا ضد لها'}
                </span>
                {activeSifah.opposite && (
                  <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full font-quran border border-amber-300 flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>الضد: {activeSifah.opposite}</span>
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black font-quran text-slate-900">
                {activeSifah.name}
              </h3>

              <div className="bg-indigo-50 border border-indigo-200/80 p-3 rounded-xl flex items-center gap-3">
                <span className="text-xs font-bold text-indigo-900 font-quran shrink-0">حروف هذه الصفة:</span>
                <span className="text-xs font-bold text-indigo-950 font-quran bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-xs">
                  {activeSifah.letters}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                {activeSifah.shortDescription}
              </p>
            </div>

            {/* Vocal Cords & Tongue Visual Simulation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Vocal Cords State */}
              <div className="bg-gradient-to-br from-slate-950 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/60 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-black font-quran text-amber-300">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>حالة الأوتار الصوتية (Vocal Cords)</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeSifah.vocalCordsState.vibration === 'intense' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                    activeSifah.vocalCordsState.vibration === 'none' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' :
                    'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {activeSifah.vocalCordsState.vibration === 'intense' ? 'اهتزاز وتذبذب شديد' :
                     activeSifah.vocalCordsState.vibration === 'none' ? 'أوتار ساكنة مفتوحة' : 'اهتزاز متوسط'}
                  </span>
                </div>

                {/* Graphical Representation of Glottis / Vocal Cords */}
                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-center h-40 relative overflow-hidden">
                  <svg viewBox="0 0 160 120" className="w-44 h-full">
                    {/* Thyroid Cartilage Rim */}
                    <circle cx="80" cy="60" r="50" fill="none" stroke="#334155" strokeWidth="4" />
                    
                    {/* Vocal Cord Left & Right */}
                    {activeSifah.vocalCordsState.diagramType === 'open_quiet' && (
                      // Wide Open Glottis (Hams)
                      <g>
                        <path d="M 80 20 L 40 90 L 55 95 L 80 35 Z" fill="#38bdf8" opacity="0.85" />
                        <path d="M 80 20 L 120 90 L 105 95 L 80 35 Z" fill="#38bdf8" opacity="0.85" />
                        {/* Air Flow Arrows */}
                        <path d="M 80 85 L 80 40" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4 2" />
                        <text x="80" y="112" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                          فتحة المزمار متسعة ومفتوحة
                        </text>
                      </g>
                    )}

                    {activeSifah.vocalCordsState.diagramType === 'closed_vibrating' && (
                      // Vibrating Closed Cords (Jahr)
                      <g>
                        <path d="M 80 20 L 73 90 L 80 92 L 80 25 Z" fill="#f43f5e" />
                        <path d="M 80 20 L 87 90 L 80 92 L 80 25 Z" fill="#f43f5e" />
                        {/* Vibration waves */}
                        <path d="M 68 55 Q 80 60 92 55" stroke="#fbbf24" strokeWidth="2.5" fill="none" className="animate-pulse" />
                        <path d="M 70 65 Q 80 70 90 65" stroke="#fbbf24" strokeWidth="2.5" fill="none" className="animate-pulse" />
                        <text x="80" y="112" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="sans-serif">
                          تذبذب واهتزاز سريع وحبس للنفس
                        </text>
                      </g>
                    )}

                    {activeSifah.vocalCordsState.diagramType === 'tight_lock' && (
                      // Completely Locked (Shiddah / Itbaq)
                      <g>
                        <path d="M 80 20 L 68 90 L 80 95 Z" fill="#e11d48" />
                        <path d="M 80 20 L 92 90 L 80 95 Z" fill="#e11d48" />
                        <line x1="80" y1="20" x2="80" y2="95" stroke="#ffffff" strokeWidth="2" />
                        <text x="80" y="112" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="sans-serif">
                          انطباق تام وحبس مطلق للصوت
                        </text>
                      </g>
                    )}

                    {activeSifah.vocalCordsState.diagramType === 'partial_flow' && (
                      // Partial Flow (Tawassut / Inhiraf)
                      <g>
                        <path d="M 80 20 L 60 90 L 72 93 L 80 30 Z" fill="#10b981" />
                        <path d="M 80 20 L 100 90 L 88 93 L 80 30 Z" fill="#10b981" />
                        <path d="M 75 75 Q 80 50 85 75" stroke="#34d399" strokeWidth="2" fill="none" />
                        <text x="80" y="112" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="sans-serif">
                          جريان جزئي متحول للصوت
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                <div className="space-y-1.5">
                  <div className="text-amber-200 text-xs font-bold font-quran">
                    {activeSifah.vocalCordsState.stateName}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {activeSifah.vocalCordsState.description}
                  </p>
                </div>
              </div>

              {/* Card 2: Tongue State & Movement */}
              <div className="bg-gradient-to-br from-slate-950 to-teal-950 text-white rounded-2xl p-5 border border-teal-900/60 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-black font-quran text-teal-300">
                    <Eye className="w-4 h-4 text-teal-400" />
                    <span>شكل وحركة اللسان (Tongue Action)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    وضع الفم والفك
                  </span>
                </div>

                {/* Graphic Representation of Tongue Elevation / Depression */}
                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-center h-40 relative overflow-hidden">
                  <svg viewBox="0 0 160 120" className="w-44 h-full">
                    {/* Roof of the mouth (Palate) */}
                    <path d="M 20 40 Q 80 20 140 45" fill="none" stroke="#64748b" strokeWidth="3" />
                    
                    {/* Tongue Outline based on shape */}
                    {activeSifah.tongueState.shape === 'elevated_back' && (
                      // Elevated Back (Isti'la)
                      <g>
                        <path d="M 30 90 Q 60 85 90 40 Q 130 35 135 80 Z" fill="#10b981" opacity="0.8" stroke="#34d399" strokeWidth="2" />
                        <path d="M 100 35 L 90 20" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow)" />
                        <text x="80" y="112" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="sans-serif">
                          ارتفاع وتقبيب أقصى اللسان للحنك
                        </text>
                      </g>
                    )}

                    {activeSifah.tongueState.shape === 'depressed_flat' && (
                      // Depressed Flat (Istifal)
                      <g>
                        <path d="M 30 85 Q 70 90 110 88 Q 135 85 135 95 Z" fill="#38bdf8" opacity="0.8" stroke="#0284c7" strokeWidth="2" />
                        <text x="80" y="112" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="sans-serif">
                          انخفاض واستواء اللسان في قاع الفم
                        </text>
                      </g>
                    )}

                    {activeSifah.tongueState.shape === 'adhered_roof' && (
                      // Adhered Roof (Itbaq)
                      <g>
                        <path d="M 25 50 Q 80 32 135 50 L 130 85 Q 80 80 30 85 Z" fill="#e11d48" opacity="0.85" stroke="#f43f5e" strokeWidth="2" />
                        <text x="80" y="112" textAnchor="middle" fill="#fb7185" fontSize="9" fontFamily="sans-serif">
                          انطباق وحصر الصوت بين اللسان والحنك
                        </text>
                      </g>
                    )}

                    {activeSifah.tongueState.shape === 'extended_forward' && (
                      // Extended Forward (Istitatah - Dhad)
                      <g>
                        <path d="M 25 70 Q 70 50 140 45 L 130 90 Z" fill="#a855f7" opacity="0.85" stroke="#c084fc" strokeWidth="2" />
                        <line x1="30" y1="65" x2="135" y2="45" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="3 2" />
                        <text x="80" y="112" textAnchor="middle" fill="#c084fc" fontSize="9" fontFamily="sans-serif">
                          استطالة وزحف الحافة حتى مخرج اللام
                        </text>
                      </g>
                    )}

                    {activeSifah.tongueState.shape === 'trembling_tip' && (
                      // Trembling Tip (Takreer - Ra)
                      <g>
                        <path d="M 30 85 Q 80 80 120 50" fill="none" stroke="#f59e0b" strokeWidth="4" />
                        <circle cx="120" cy="50" r="5" fill="#f59e0b" className="animate-ping" />
                        <text x="80" y="112" textAnchor="middle" fill="#fcd34d" fontSize="9" fontFamily="sans-serif">
                          ارتعاد رأس اللسان ارتعادة واحدة
                        </text>
                      </g>
                    )}

                    {(!['elevated_back', 'depressed_flat', 'adhered_roof', 'extended_forward', 'trembling_tip'].includes(activeSifah.tongueState.shape)) && (
                      <g>
                        <path d="M 30 85 Q 80 75 130 70 Z" fill="#14b8a6" opacity="0.8" stroke="#2dd4bf" strokeWidth="2" />
                        <text x="80" y="112" textAnchor="middle" fill="#5eead4" fontSize="9" fontFamily="sans-serif">
                          تجاوز وسلاسة مجرى الهواء في الفم
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                <div className="space-y-1.5">
                  <div className="text-teal-200 text-xs font-bold font-quran">
                    {activeSifah.tongueState.stateName}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {activeSifah.tongueState.description}
                  </p>
                </div>
              </div>

            </div>

            {/* Scholarly Wisdom & Technical Guidance */}
            <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-black font-quran text-sm">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>الضابط الأكاديمي والتحرير النظري للصفة:</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-tajawal">
                {activeSifah.scholarlyWisdom}
              </p>
            </div>

            {/* Mistakes Warning & Quranic Application */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-950 font-black font-quran text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>خطأ شائع في هذه الصفة:</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  {activeSifah.commonMistakes}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5 text-center">
                <span className="text-xs font-bold font-quran text-emerald-950 block">تطبيق قرآني نموذجي:</span>
                <div className="text-xl font-black font-quran text-emerald-950">
                  ﴿{activeSifah.quranicExample.word}﴾
                </div>
                <div className="text-[11px] text-slate-600 font-quran">
                  {activeSifah.quranicExample.verse}
                </div>
                <div className="text-[10px] text-amber-800 font-bold">
                  {activeSifah.quranicExample.surah}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Mode 2: Vocal Cords Comparison (Hams vs Jahr) */}
      {activeTab === 'compare_vocal' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black font-quran text-slate-900">
              المقارنة التشريحية الشاملة: حركة الأوتار الصوتية بين الهَمْس والجَهْر
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              الفارق الجوهري بين الهمس والجهر يكمن في الحنجرة والأوتار الصوتية (Glottis)، وليس في أعضاء الفم:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hams Column */}
            <div className="bg-cyan-950 text-white rounded-2xl p-6 border border-cyan-800 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-900 pb-3">
                <span className="text-base font-black font-quran text-cyan-300">1. صفة الهَمْس (حروف فحثه شخص سكت)</span>
                <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-1 rounded-full font-bold">نَفَس جَارٍ</span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <strong className="text-cyan-300 block font-quran mb-1">وضعية الأوتار الصوتية:</strong>
                  تتباعد الأوتار الصوتية عن بعضها تماماً وتتسع فتحة المزمار، فتكون ساكنة مسترخية لا تهتز ولا تذبذب فيها.
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <strong className="text-cyan-300 block font-quran mb-1">طبيعة تدفق الهواء (النفس):</strong>
                  يمر هواء الزفير المتدفق من الرئتين بحرية تامة دون ممانعة أو مقاومة، فيخرج صوت خافت مصحوباً بنفخة هواء ملموسة عند الفم.
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <strong className="text-cyan-300 block font-quran mb-1">التجربة الميدانية:</strong>
                  ضع يدك أمام فمك وانطق: ﴿اسْ﴾ أو ﴿أَفْ﴾ تلاحظ سيل الهواء المنطلق الملامس لراحة يدك.
                </div>
              </div>
            </div>

            {/* Jahr Column */}
            <div className="bg-indigo-950 text-white rounded-2xl p-6 border border-indigo-800 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-900 pb-3">
                <span className="text-base font-black font-quran text-amber-300">2. صفة الجَهْر (باقي أحرف الهجاء الـ 19)</span>
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-full font-bold">نَفَس مَحْبُوس</span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <strong className="text-amber-300 block font-quran mb-1">وضعية الأوتار الصوتية:</strong>
                  تتقارب الأوتار الصوتية وتضيق فتحة المزمار، وتتذبذب وتهتز بسرعة شديدة تحت ضغط الهواء الصاعد من الصدر.
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <strong className="text-amber-300 block font-quran mb-1">طبيعة تدفق الهواء (النفس):</strong>
                  ينحبس هواء الزفير ولا يخرج حراً، بل يتحول بكامله إلى رنين صوتي مجهور قوي له طنين واهتزاز.
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <strong className="text-amber-300 block font-quran mb-1">التجربة الميدانية:</strong>
                  ضع يدك على تفاحة آدم أو حنجرتك وانطق: ﴿ازْ﴾ أو ﴿أَلْ﴾ تلاحظ اهتزازاً وطنيناً حنجرياً قوياً في باطن اليد.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Tongue Shape Comparison (Isti'la & Itbaq vs Istifal & Infitah) */}
      {activeTab === 'compare_tongue' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black font-quran text-slate-900">
              المقارنة التشريحية الشاملة: شكل اللسان بين الاستعلاء والإطباق والاستفال
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              كيف يتغير شكل اللسان ومسار الصوت داخل تجويف الفم لإحداث التفخيم والترقيق:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Isti'la */}
            <div className="bg-amber-950 text-white rounded-2xl p-5 border border-amber-800/80 space-y-3">
              <div className="text-amber-300 font-black font-quran text-sm border-b border-amber-900 pb-2">
                1. الاستعلاء (خص ضغط قظ)
              </div>
              <ul className="text-xs space-y-2 text-slate-300 leading-relaxed">
                <li>• يرتفع **أقصى اللسان** فقط نحو الحنك اللحمي.</li>
                <li>• يتراجع لسان المزمار قليلاً للخلف ويتضيق الحلق.</li>
                <li>• يتصعد صدى الصوت إلى قبة الحنك الأعلى فيمتلئ الفم بالصدى (التفخيم).</li>
              </ul>
            </div>

            {/* Card 2: Itbaq */}
            <div className="bg-rose-950 text-white rounded-2xl p-5 border border-rose-800/80 space-y-3">
              <div className="text-rose-300 font-black font-quran text-sm border-b border-rose-900 pb-2">
                2. الإطباق (ص - ض - ط - ظ)
              </div>
              <ul className="text-xs space-y-2 text-slate-300 leading-relaxed">
                <li>• يرتفع **أقصى اللسان ووسطه وطرفه معاً** محاذياً قبة الحنك.</li>
                <li>• ينحصر الصوت تماماً في فراغ شديد الضيق بين اللسان والحنك.</li>
                <li>• ينتج عنه أعلى درجات التفخيم والقوة الصوتية في القرآن.</li>
              </ul>
            </div>

            {/* Card 3: Istifal & Infitah */}
            <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-800/80 space-y-3">
              <div className="text-emerald-300 font-black font-quran text-sm border-b border-emerald-900 pb-2">
                3. الاستفال والانفتاح (باقي الحروف)
              </div>
              <ul className="text-xs space-y-2 text-slate-300 leading-relaxed">
                <li>• يستفل **أقصى اللسان ويستقر منبسطاً** في قاع الفم.</li>
                <li>• يتسع مجرى الحلق والفم دون انحصار للصوت في السقف.</li>
                <li>• يخرج الصوت مستفلاً رقيقاً نحيفاً (الترقيق الأصلي).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
