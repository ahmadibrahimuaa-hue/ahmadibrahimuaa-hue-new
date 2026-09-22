import { SingleCourseProgress } from './studentProgressStorage';
import { Course } from '../types';
import { getCourseById, ALL_COURSES } from '../data/courses';

export interface StudentBadge {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  category: 'unit' | 'exam' | 'special' | 'course';
  color: {
    border: string;
    bg: string;
    text: string;
    badge: string;
    glow: string;
  };
  isUnlocked: boolean;
  unlockedAt?: string;
  requirement: string;
  courseId?: string;
  unitNumber?: number;
  score?: number;
}

// Sound synthesizer for celebrating newly earned badges
export const playBadgeCelebrationSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Fanfare Notes (G4, C5, E5, G5)
    const notes = [392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.45);
    });
  } catch (e) {
    // Audio synthesis fallback
  }
};

const SAKINAN_UNIT_BADGES_CONFIG: Record<number, { title: string; subtitle: string; icon: string; desc: string }> = {
  1: {
    title: 'فاتحة الإتقان 🌱',
    subtitle: 'إتمام الباب الأول',
    icon: '🌱',
    desc: 'إتقان المدخل التأسيسي وقواعد التقاء الساكنين في الرسم العثماني.',
  },
  2: {
    title: 'فارس الكلمة الواحدة 🌿',
    subtitle: 'إتمام الباب الثاني',
    icon: '🌿',
    desc: 'إتقان ضوابط التقاء الساكنين في كلمة واحدة وصلاً ووقفاً.',
  },
  3: {
    title: 'خبير الكسر العارض 💠',
    subtitle: 'إتمام الباب الثالث',
    icon: '💠',
    desc: 'إتقان أحكام التخلص بالكسر العارض ومواضع حفص الخمسة.',
  },
  4: {
    title: 'متقن الفتح والضم 💎',
    subtitle: 'إتمام الباب الرابع',
    icon: '💎',
    desc: 'إتقان مواضع التخلص بالفتح العارض والضم العارض وميم الجمع.',
  },
  5: {
    title: 'حارس الأصول والوقف 🛡️',
    subtitle: 'إتمام الباب الخامس',
    icon: '🛡️',
    desc: 'إتقان أحكام الحذف والوقف والعارض للسكون ومد اللين.',
  },
  6: {
    title: 'ضابط الاستثناءات 📜',
    subtitle: 'إتمام الباب السادس',
    icon: '📜',
    desc: 'إتقان الاستثناءات والكلمات الخلافية والتأصيل القرآني.',
  },
};

const IDGHAM_UNIT_BADGES_CONFIG: Record<number, { title: string; subtitle: string; icon: string; desc: string }> = {
  1: {
    title: 'خبير المتماثلين ✨',
    subtitle: 'إتمام الباب الأول',
    icon: '✨',
    desc: 'إتقان إدغام المتماثلين (المثلين) وأقسامه واستثناءات مد الواو والياء.',
  },
  2: {
    title: 'متقن المتجانسين 🔹',
    subtitle: 'إتمام الباب الثاني',
    icon: '🔹',
    desc: 'إتقان مواضع إدغام المتجانسين الصغير والناقص عند حفص.',
  },
  3: {
    title: 'ضابط المتقاربين 🔸',
    subtitle: 'إتمام الباب الثالث',
    icon: '🔸',
    desc: 'إتقان مواضع المتقاربين الخمسة: اللام والراء، القاف والكاف.',
  },
  4: {
    title: 'عالم الإدغام الكبير 🪐',
    subtitle: 'إتمام الباب الرابع',
    icon: '🪐',
    desc: 'إتقان مذهب حفص في الإدغام الكبير والمطلق وتوجيهه.',
  },
  5: {
    title: 'حارس رسم المصحف ✒️',
    subtitle: 'إتمام الباب الخامس',
    icon: '✒️',
    desc: 'إتقان علامات الضبط وتجريد الحرف الأول وتشديد الثاني في المصحف.',
  },
};

const MAKHARIJ_UNIT_BADGES_CONFIG: Record<number, { title: string; subtitle: string; icon: string; desc: string }> = {
  1: {
    title: 'فارس المخارج السبعة عشر 🎙️',
    subtitle: 'إتمام الباب الأول',
    icon: '🎙️',
    desc: 'إتقان المخارج الخمسة العامة والسبعة عشر الخاصة ومذاهب أئمة القراءات الخليل وابن الجزري والشاطبي.',
  },
  2: {
    title: 'حارس الصفات والتفخيم 💎',
    subtitle: 'إتمام الباب الثاني',
    icon: '💎',
    desc: 'إتقان الصفات المتضادة وغير المتضادة ومراتب القلقلة والتفخيم والترقيق.',
  },
  3: {
    title: 'متقن التحريرات وتخليص المتجاورات ⚖️',
    subtitle: 'إتمام الباب الثالث',
    icon: '⚖️',
    desc: 'إتقان ألقاب الحروف وتخليص المفخم من المرقق ودقائق الأداء التجويدي المحرر.',
  },
};

export const getCourseBadges = (
  prog: SingleCourseProgress,
  courseId: string = 'sakinan'
): StudentBadge[] => {
  const course = getCourseById(courseId) || ALL_COURSES[0];
  const badges: StudentBadge[] = [];
  const totalUnitsCount = course.units ? course.units.length : 5;
  const completedUnits = prog.completedUnitNumbers || [];
  const examScore = prog.examBestScore;
  const isExamDone = prog.examCompleted;

  // 1. Unit Completion Badges (For each unit in this course)
  if (course.units && course.units.length > 0) {
    course.units.forEach((unit) => {
      const uNum = unit.unitNumber || 1;
      const isCompleted = completedUnits.includes(uNum);
      let config = {
        title: `وسام ${unit.title || `الباب ${uNum}`}`,
        subtitle: `إتمام الباب ${uNum}`,
        icon: '🏅',
        desc: `إتمام ودراسة ${unit.title} بنجاح.`,
      };

      if (courseId === 'sakinan' && SAKINAN_UNIT_BADGES_CONFIG[uNum]) {
        config = SAKINAN_UNIT_BADGES_CONFIG[uNum];
      } else if (courseId === 'idgham' && IDGHAM_UNIT_BADGES_CONFIG[uNum]) {
        config = IDGHAM_UNIT_BADGES_CONFIG[uNum];
      } else if (courseId === 'makharij' && MAKHARIJ_UNIT_BADGES_CONFIG[uNum]) {
        config = MAKHARIJ_UNIT_BADGES_CONFIG[uNum];
      }

      badges.push({
        id: `unit_${courseId}_${uNum}`,
        title: config.title,
        subtitle: config.subtitle,
        description: config.desc,
        icon: config.icon,
        category: 'unit',
        courseId,
        unitNumber: uNum,
        requirement: `دراسة وإتمام الباب ${uNum} في ${course.shortTitle || course.title}`,
        isUnlocked: isCompleted,
        color: {
          border: isCompleted ? 'border-emerald-500/60' : 'border-slate-800',
          bg: isCompleted ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900' : 'bg-slate-900/60',
          text: isCompleted ? 'text-emerald-200' : 'text-slate-500',
          badge: isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-500 border-slate-700',
          glow: isCompleted ? 'shadow-emerald-900/40 shadow-md' : '',
        },
      });
    });
  }

  // 2. Full Exam Score 100% Golden Crown Badge (تاج الدرجة الكاملة 100%)
  const isPerfectExam = Boolean(isExamDone && examScore !== null && examScore >= 100);
  badges.push({
    id: `exam_perfect_${courseId}`,
    title: 'تاج الدرجة الكاملة 100% 👑',
    subtitle: 'العلامة الكاملة في الاختبار النهائي',
    description: `تحقيق الدرجة النهائية التامة 100% في الاختبار النهائي الشامل لـ (${course.shortTitle || course.title}) دون أي خطأ.`,
    icon: '👑',
    category: 'exam',
    courseId,
    score: 100,
    requirement: 'الحصول على 100% في الاختبار النهائي الشامل',
    isUnlocked: isPerfectExam,
    color: {
      border: isPerfectExam ? 'border-amber-400' : 'border-slate-800',
      bg: isPerfectExam ? 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-900/80' : 'bg-slate-900/60',
      text: isPerfectExam ? 'text-amber-300 font-extrabold' : 'text-slate-500',
      badge: isPerfectExam ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-slate-800 text-slate-500 border-slate-700',
      glow: isPerfectExam ? 'shadow-amber-500/30 shadow-lg border-2' : '',
    },
  });

  // 3. Exam Academic Distinction 90%+ (وسام الامتياز والاجتياز)
  const isPassedExam = Boolean(isExamDone && examScore !== null && examScore >= 90);
  badges.push({
    id: `exam_distinction_${courseId}`,
    title: 'وسام الامتياز والاجتياز 🥇',
    subtitle: 'اجتياز معتمد 90% فأكثر',
    description: `اجتياز الاختبار النهائي الشامل بدرجة امتياز (حققت: ${examScore !== null ? `${examScore}%` : 'لم يتم'}) واستحقاق الشهادة المعتمدة.`,
    icon: '🥇',
    category: 'exam',
    courseId,
    score: examScore || undefined,
    requirement: 'اجتياز الاختبار النهائي الشامل بنسبة 90% أو أعلى',
    isUnlocked: isPassedExam,
    color: {
      border: isPassedExam ? 'border-purple-500/60' : 'border-slate-800',
      bg: isPassedExam ? 'bg-gradient-to-br from-purple-950/80 to-slate-900' : 'bg-slate-900/60',
      text: isPassedExam ? 'text-purple-200' : 'text-slate-500',
      badge: isPassedExam ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-800 text-slate-500 border-slate-700',
      glow: isPassedExam ? 'shadow-purple-900/40 shadow-md' : '',
    },
  });

  // 4. Master of All Units (حافظ الأبواب المنهاجية)
  const isAllUnitsCompleted = completedUnits.length >= totalUnitsCount && totalUnitsCount > 0;
  badges.push({
    id: `all_units_${courseId}`,
    title: 'حافظ الأبواب المنهاجية 🏆',
    subtitle: 'إتمام جميع أبواب الحقيبة',
    description: `إتقان وإتمام كافة أبواب الحقيبة التدريبية (${completedUnits.length}/${totalUnitsCount} أبواب).`,
    icon: '🏆',
    category: 'unit',
    courseId,
    requirement: `إتمام دراسة جميع أبواب الحقيبة (${totalUnitsCount} أبواب)`,
    isUnlocked: isAllUnitsCompleted,
    color: {
      border: isAllUnitsCompleted ? 'border-amber-500/60' : 'border-slate-800',
      bg: isAllUnitsCompleted ? 'bg-gradient-to-br from-amber-950/70 to-slate-900' : 'bg-slate-900/60',
      text: isAllUnitsCompleted ? 'text-amber-200' : 'text-slate-500',
      badge: isAllUnitsCompleted ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-500 border-slate-700',
      glow: isAllUnitsCompleted ? 'shadow-amber-900/30 shadow-md' : '',
    },
  });

  // 5. Explorer of References & Special Sections (مستكشف المراجع والتطبيقات)
  const readSectionsCount = (prog.readSections || []).length;
  const isExplorer = readSectionsCount >= 3;
  badges.push({
    id: `explorer_${courseId}`,
    title: 'مستكشف المراجع والأصول 📖',
    subtitle: 'دراسة الأقسام التخصصية',
    description: 'الاطلاع المنهجي على الكلمات المستثناة والمختبر القرآني وجدول المقارنات ومنظومة القواعد.',
    icon: '📖',
    category: 'special',
    courseId,
    requirement: 'الاطلاع على 3 أقسام إثرائية أو أكثر',
    isUnlocked: isExplorer,
    color: {
      border: isExplorer ? 'border-blue-500/60' : 'border-slate-800',
      bg: isExplorer ? 'bg-gradient-to-br from-blue-950/80 to-slate-900' : 'bg-slate-900/60',
      text: isExplorer ? 'text-blue-200' : 'text-slate-500',
      badge: isExplorer ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-800 text-slate-500 border-slate-700',
      glow: isExplorer ? 'shadow-blue-900/40 shadow-md' : '',
    },
  });

  // 6. Complete Course Mastery (خبير الحقيبة)
  const isCompleteCourse = isAllUnitsCompleted && isPassedExam && isExplorer;
  badges.push({
    id: `course_master_${courseId}`,
    title: `خبير ${course.shortTitle || course.title} ⭐`,
    subtitle: 'إكمال 100% من متطلبات الحقيبة',
    description: `إنجاز شامل لكافة أبواب واختبارات وأقسام حقيبة (${course.title}).`,
    icon: '⭐',
    category: 'course',
    courseId,
    requirement: 'إتمام جميع الأبواب + اجتياز الاختبار الشامل بنجاح + دراسة المراجع',
    isUnlocked: isCompleteCourse,
    color: {
      border: isCompleteCourse ? 'border-amber-400' : 'border-slate-800',
      bg: isCompleteCourse ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950' : 'bg-slate-900/60',
      text: isCompleteCourse ? 'text-slate-950 font-black' : 'text-slate-500',
      badge: isCompleteCourse ? 'bg-slate-950 text-amber-300 font-bold border-slate-950' : 'bg-slate-800 text-slate-500 border-slate-700',
      glow: isCompleteCourse ? 'shadow-amber-400/50 shadow-xl' : '',
    },
  });

  return badges;
};

// Dispatch global event when new badge is earned to trigger celebration toast
export const notifyBadgeUnlocked = (badge: StudentBadge) => {
  if (typeof window === 'undefined') return;
  playBadgeCelebrationSound();
  window.dispatchEvent(
    new CustomEvent('tajweed_badge_unlocked', {
      detail: badge,
    })
  );
};
