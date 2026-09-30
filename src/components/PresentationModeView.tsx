import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Course, Unit, Lesson } from '../types';
import { 
  X, Maximize2, Minimize2, ChevronLeft, ChevronRight,
  Eraser, Undo2, Redo2, Trash2, Download, Eye, EyeOff,
  Sparkles, BookOpen, Layers, Target, HelpCircle, UserCheck,
  Palette, Sun, Moon, Type, Lightbulb, MousePointer, Square,
  ArrowUpRight, CheckCircle2, Award, Volume2, FileText,
  Bookmark, ShieldAlert, Monitor, Check
} from 'lucide-react';

interface PresentationModeViewProps {
  course: Course;
  unit: Unit;
  initialLessonIndex?: number;
  onClose: () => void;
  isTeacherMode?: boolean;
}

type PresentationTheme = 'parchment' | 'chalkboard' | 'dark';
type DrawingTool = 'pen' | 'highlighter' | 'laser' | 'box' | 'arrow' | 'eraser';

interface DrawAction {
  tool: DrawingTool;
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
}

export const PresentationModeView: React.FC<PresentationModeViewProps> = ({
  course,
  unit,
  initialLessonIndex = 0,
  onClose,
  isTeacherMode = true,
}) => {
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(() => {
    return (initialLessonIndex >= 0 && initialLessonIndex < (unit.lessons?.length || 1))
      ? initialLessonIndex
      : 0;
  });

  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [theme, setTheme] = useState<PresentationTheme>('parchment');
  const [fontSizeScale, setFontSizeScale] = useState<'normal' | 'large' | 'huge'>('large');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTeacherNotesDrawer, setShowTeacherNotesDrawer] = useState<boolean>(false);
  const [showSlideListDrawer, setShowSlideListDrawer] = useState<boolean>(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  // Drawing Tools State
  const [isDrawModeActive, setIsDrawModeActive] = useState<boolean>(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#ef4444'); // Default ruby red
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [laserPosition, setLaserPosition] = useState<{ x: number; y: number } | null>(null);

  // Per-slide drawing histories (keyed by `slideKey`)
  const [slideDrawings, setSlideDrawings] = useState<Record<string, DrawAction[]>>({});
  const [slideRedoStacks, setSlideRedoStacks] = useState<Record<string, DrawAction[]>>({});

  // DOM References
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentActionRef = useRef<DrawAction | null>(null);

  const currentLesson: Lesson = unit.lessons?.[activeLessonIdx] || {
    id: 'placeholder',
    lessonNumber: 1,
    title: unit.title,
    subtitle: unit.subtitle,
    content: unit.description,
  };

  // Build presentation slides dynamically from the lesson & unit data
  const slides = useMemo(() => {
    const list: Array<{
      id: string;
      category: string;
      title: string;
      subtitle?: string;
      icon: React.ReactNode;
      type: 'overview' | 'rule' | 'explanation' | 'examples' | 'mindmap' | 'exceptions' | 'oral' | 'discussion' | 'whiteboard';
      teacherTip?: string;
    }> = [];

    // Slide 1: Lesson Card & Learning Objectives
    list.push({
      id: 'overview',
      category: 'بطاقة الدرس والأهداف',
      title: currentLesson.title,
      subtitle: currentLesson.subtitle,
      icon: <Target className="w-5 h-5 text-emerald-500" />,
      type: 'overview',
      teacherTip: 'افتتح الشرح بربط هذا الدرس بما قبله في المنظومة، وركز على التطبيق العملي التجويدي دون الاكتفاء بالتنظير.',
    });

    // Slide 2: Core Rule & Matn/Evidence
    list.push({
      id: 'rule',
      category: 'التأصيل القرآني والمتن التجويدي',
      title: 'القاعدة التجويدية المركزية والدليل من المتون',
      subtitle: `الباب 0${unit.unitNumber}: استحضار الأدلة من الجزرية وتحفة الأطفال`,
      icon: <Bookmark className="w-5 h-5 text-amber-500" />,
      type: 'rule',
      teacherTip: 'اطلب من أحد طلاب معهد القراءات قراءة الشاهد الشعري أولاً، مع تصحيح الوزن والنطق السليم للفظ المنظومة.',
    });

    // Slide 3: Detailed Explanation & Analysis
    list.push({
      id: 'explanation',
      category: 'الشرح والبيان والتحريرات العلمية',
      title: 'البيان التحليلي والتفصيل المنهجي للحكم',
      subtitle: 'دقائق المسائل وشروط التطبيق الصحيح',
      icon: <BookOpen className="w-5 h-5 text-sky-500" />,
      type: 'explanation',
      teacherTip: 'استخدم قلم الشرح لتحديد شروط الحكم ووضع دوائر أو أسهم على الكلمات المفتاحية.',
    });

    // Slide 4: Interactive Quranic Examples
    list.push({
      id: 'examples',
      category: 'المختبر القرآني والتطبيق الحي',
      title: 'شواهد وأمثلة التلاوة من المصحف الشريف',
      subtitle: 'تطبيق صوتي وتوجيه عملي لنطق الحروف والأحكام',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      type: 'examples',
      teacherTip: 'اختبر الطلاب شفهياً قبل الضغط على زر إظهار التوجيه، ووجّههم لمراعاة زمن الغنة ومقدار المد.',
    });

    // Slide 5: Mind Map & Visual Hierarchy
    list.push({
      id: 'mindmap',
      category: 'التشجير والخريطة المفاهيمية',
      title: 'الخريطة الذهنية لتصنيف الأحكام',
      subtitle: 'رؤية بصرية شاملة لتيسير الحفظ والاستحضار',
      icon: <Layers className="w-5 h-5 text-indigo-500" />,
      type: 'mindmap',
      teacherTip: 'الخرائط المفاهيمية ترسخ استحضار الفروع في ذهن الطالب أثناء التلاوة عند الوقف والابتداء.',
    });

    // Slide 6: Cautions & Critical Nuances
    if (unit.commonMistakes && unit.commonMistakes.length > 0) {
      list.push({
        id: 'exceptions',
        category: 'التنبيهات والأخطاء الشائعة',
        title: 'أخطاء القراء والتنبيهات المنهجية الدقيقة',
        subtitle: 'ما ينبغي على طالب معهد القراءات توقيه والتحذير منه',
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
        type: 'exceptions',
        teacherTip: 'نبّه الطلاب إلى الأخطاء التي تقع بسبب سرعة التلاوة أو قلة التحرز في أزمنة السواكن والحركات.',
      });
    }

    // Slide 7: Oral Recitation Drill
    if (currentLesson.recitationTask) {
      list.push({
        id: 'oral',
        category: 'المشافهة والتطبيق العملي المباشر',
        title: 'تدريب التلاوة الفردي والجماعي',
        subtitle: 'العرض الشفهي على الشيخ وتصحيح الأداء',
        icon: <Volume2 className="w-5 h-5 text-emerald-500" />,
        type: 'oral',
        teacherTip: 'اختر طالباً تلو الآخر للقراءة برواية حفص عن عاصم، ودوّن ملاحظاتك على الشاشة مباشرة بقلم الشرح.',
      });
    }

    // Slide 8: Discussion Q&A Cards
    if (currentLesson.discussionQuestions && currentLesson.discussionQuestions.length > 0) {
      list.push({
        id: 'discussion',
        category: 'المناقشة والاستيعاب المباشر',
        title: 'أسئلة الحوار وتثبيت المسائل التجويدية',
        subtitle: 'تفاعل صفي حي واستثارة لملكة الاستنباط لدى الطلاب',
        icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
        type: 'discussion',
        teacherTip: 'دع الطلاب يتناقشون في الإجابة، ثم انقر على «كشف الإجابة النموذجية» للمقارنة والتعليق.',
      });
    }

    // Slide 9: Blank Teaching Whiteboard
    list.push({
      id: 'whiteboard',
      category: 'السبورة التفاعلية الحرة',
      title: 'لوحة الشرح التفاعلي والتدوين الحر',
      subtitle: 'مساحة مخصصة للمعلم لرسم المخططات وتوضيح استفسارات الدارسين',
      icon: <FileText className="w-5 h-5 text-teal-500" />,
      type: 'whiteboard',
      teacherTip: 'سبورة حرة تماماً لكتابة أي كلمة أو رسم تفريعات إضافية أثناء الدرس.',
    });

    return list;
  }, [currentLesson, unit]);

  const currentSlide = slides[activeSlideIdx] || slides[0];
  const slideKey = `${course.id}_u${unit.unitNumber}_l${currentLesson.lessonNumber}_s${currentSlide.id}`;

  // Reset or constrain slide index if lesson changes
  useEffect(() => {
    setActiveSlideIdx(0);
    setRevealedAnswers({});
  }, [activeLessonIdx]);

  // Handle true browser fullscreen API
  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in any input, ignore
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setActiveSlideIdx((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
        e.preventDefault();
        setActiveSlideIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        if (showSlideListDrawer) setShowSlideListDrawer(false);
        else if (showTeacherNotesDrawer) setShowTeacherNotesDrawer(false);
        else onClose();
      } else if (e.key.toLowerCase() === 'p') {
        setIsDrawModeActive((prev) => !prev);
        setCurrentTool('pen');
      } else if (e.key.toLowerCase() === 'h') {
        setIsDrawModeActive(true);
        setCurrentTool('highlighter');
      } else if (e.key.toLowerCase() === 'e') {
        setIsDrawModeActive(true);
        setCurrentTool('eraser');
      } else if (e.key.toLowerCase() === 'l') {
        setIsDrawModeActive(true);
        setCurrentTool('laser');
      } else if (e.key.toLowerCase() === 'f') {
        toggleBrowserFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, showSlideListDrawer, showTeacherNotesDrawer, onClose]);

  // Synchronize Canvas Dimensions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const actions = slideDrawings[slideKey] || [];
    actions.forEach((act) => {
      ctx.save();
      ctx.lineWidth = act.lineWidth;
      ctx.strokeStyle = act.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (act.tool === 'highlighter') {
        ctx.globalAlpha = 0.4;
      } else {
        ctx.globalAlpha = 1.0;
      }

      if (act.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (act.tool === 'box' && act.startPoint && act.endPoint) {
        const x = Math.min(act.startPoint.x, act.endPoint.x);
        const y = Math.min(act.startPoint.y, act.endPoint.y);
        const w = Math.abs(act.startPoint.x - act.endPoint.x);
        const h = Math.abs(act.startPoint.y - act.endPoint.y);
        ctx.strokeRect(x, y, w, h);
      } else if (act.tool === 'arrow' && act.startPoint && act.endPoint) {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(act.startPoint.x, act.startPoint.y);
        ctx.lineTo(act.endPoint.x, act.endPoint.y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(act.endPoint.y - act.startPoint.y, act.endPoint.x - act.startPoint.x);
        const headlen = 14;
        ctx.beginPath();
        ctx.moveTo(act.endPoint.x, act.endPoint.y);
        ctx.lineTo(
          act.endPoint.x - headlen * Math.cos(angle - Math.PI / 6),
          act.endPoint.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(act.endPoint.x, act.endPoint.y);
        ctx.lineTo(
          act.endPoint.x - headlen * Math.cos(angle + Math.PI / 6),
          act.endPoint.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (act.points && act.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(act.points[0].x, act.points[0].y);
        for (let i = 1; i < act.points.length; i++) {
          ctx.lineTo(act.points[i].x, act.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    });
  }, [slideDrawings, slideKey]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, activeSlideIdx]);

  // Handle window resizing for canvas
  useEffect(() => {
    const handleResize = () => {
      redrawCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Mouse & Touch Drawing Handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawModeActive) return;
    const pt = getCanvasCoords(e);

    if (currentTool === 'laser') {
      setLaserPosition(pt);
      return;
    }

    isDrawingRef.current = true;
    const effWidth = currentTool === 'highlighter' ? strokeWidth * 3 : currentTool === 'eraser' ? strokeWidth * 4 : strokeWidth;

    currentActionRef.current = {
      tool: currentTool,
      color: strokeColor,
      lineWidth: effWidth,
      points: [pt],
      startPoint: pt,
      endPoint: pt,
    };
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawModeActive) return;
    const pt = getCanvasCoords(e);

    if (currentTool === 'laser') {
      setLaserPosition(pt);
      return;
    }

    if (!isDrawingRef.current || !currentActionRef.current) return;

    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      currentActionRef.current.points?.push(pt);
    } else if (currentTool === 'box' || currentTool === 'arrow') {
      currentActionRef.current.endPoint = pt;
    }

    // Dynamic preview drawing
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    redrawCanvas();

    // Draw active in-progress shape
    ctx.save();
    ctx.lineWidth = currentActionRef.current.lineWidth;
    ctx.strokeStyle = currentActionRef.current.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentActionRef.current.tool === 'highlighter') {
      ctx.globalAlpha = 0.4;
    } else if (currentActionRef.current.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    if (currentActionRef.current.tool === 'box' && currentActionRef.current.startPoint) {
      const x = Math.min(currentActionRef.current.startPoint.x, pt.x);
      const y = Math.min(currentActionRef.current.startPoint.y, pt.y);
      const w = Math.abs(currentActionRef.current.startPoint.x - pt.x);
      const h = Math.abs(currentActionRef.current.startPoint.y - pt.y);
      ctx.strokeRect(x, y, w, h);
    } else if (currentActionRef.current.tool === 'arrow' && currentActionRef.current.startPoint) {
      ctx.beginPath();
      ctx.moveTo(currentActionRef.current.startPoint.x, currentActionRef.current.startPoint.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    } else if (currentActionRef.current.points && currentActionRef.current.points.length > 1) {
      const pts = currentActionRef.current.points;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = () => {
    if (!isDrawModeActive) return;
    if (currentTool === 'laser') {
      setLaserPosition(null);
      return;
    }

    if (!isDrawingRef.current || !currentActionRef.current) return;
    isDrawingRef.current = false;

    const action = currentActionRef.current;
    currentActionRef.current = null;

    setSlideDrawings((prev) => {
      const currentList = prev[slideKey] || [];
      return {
        ...prev,
        [slideKey]: [...currentList, action],
      };
    });

    // Clear redo stack on new action
    setSlideRedoStacks((prev) => ({
      ...prev,
      [slideKey]: [],
    }));

    redrawCanvas();
  };

  const handleUndo = () => {
    const list = slideDrawings[slideKey] || [];
    if (list.length === 0) return;
    const last = list[list.length - 1];
    setSlideDrawings((prev) => ({
      ...prev,
      [slideKey]: list.slice(0, -1),
    }));
    setSlideRedoStacks((prev) => ({
      ...prev,
      [slideKey]: [...(prev[slideKey] || []), last],
    }));
  };

  const handleRedo = () => {
    const redoList = slideRedoStacks[slideKey] || [];
    if (redoList.length === 0) return;
    const next = redoList[redoList.length - 1];
    setSlideRedoStacks((prev) => ({
      ...prev,
      [slideKey]: redoList.slice(0, -1),
    }));
    setSlideDrawings((prev) => ({
      ...prev,
      [slideKey]: [...(prev[slideKey] || []), next],
    }));
  };

  const handleClearSlideCanvas = () => {
    if (window.confirm('هل تريد مسح جميع الرسومات والتعليقات على هذه الشريحة؟')) {
      setSlideDrawings((prev) => ({
        ...prev,
        [slideKey]: [],
      }));
      setSlideRedoStacks((prev) => ({
        ...prev,
        [slideKey]: [],
      }));
      redrawCanvas();
    }
  };

  // Export current slide as high quality image
  const handleExportSlideImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `شريحة_تجويد_${currentLesson.lessonNumber}_${currentSlide.id}.png`;
      a.click();
    } catch (e) {
      console.error('Failed to export slide image:', e);
    }
  };

  // Theme-specific styles
  const themeClasses = {
    parchment: {
      bg: 'bg-[#F8F5EC] text-stone-900',
      panel: 'bg-[#f4efe4] border-stone-300/80 text-stone-800',
      card: 'bg-white/95 border-stone-200/90 shadow-sm text-stone-900',
      header: 'bg-[#f4efe4]/95 border-stone-300 text-stone-900',
      footer: 'bg-[#f4efe4]/95 border-stone-300 text-stone-700',
      highlight: 'bg-amber-100/90 border-amber-300 text-amber-950',
      accentText: 'text-emerald-800',
    },
    chalkboard: {
      bg: 'bg-[#064e3b] text-emerald-50',
      panel: 'bg-[#043e2f] border-emerald-700/60 text-emerald-100',
      card: 'bg-[#085a45]/90 border-emerald-600/50 shadow-md text-emerald-50',
      header: 'bg-[#043e2f]/95 border-emerald-700 text-emerald-100',
      footer: 'bg-[#043e2f]/95 border-emerald-700 text-emerald-200',
      highlight: 'bg-emerald-950/80 border-amber-400/60 text-amber-300',
      accentText: 'text-amber-300',
    },
    dark: {
      bg: 'bg-[#0b0f19] text-slate-100',
      panel: 'bg-[#111827] border-slate-800 text-slate-200',
      card: 'bg-[#1e293b]/95 border-slate-700/80 shadow-md text-slate-100',
      header: 'bg-[#0f172a]/95 border-slate-800 text-slate-100',
      footer: 'bg-[#0f172a]/95 border-slate-800 text-slate-300',
      highlight: 'bg-slate-800 border-amber-400/50 text-amber-300',
      accentText: 'text-emerald-400',
    },
  }[theme];

  const fontSizeClass = {
    normal: 'text-base sm:text-lg leading-relaxed',
    large: 'text-lg sm:text-xl md:text-2xl leading-loose',
    huge: 'text-xl sm:text-2xl md:text-3xl leading-[2.2]',
  }[fontSizeScale];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col font-tajawal dir-rtl select-none transition-colors duration-300 overflow-hidden ${themeClasses.bg}`}
      aria-label="عرض الدرس التقديمي لمعاهد القراءات"
    >
      {/* Top Presentation Bar: Lesson Tabs, Slide Meta, Fullscreen & Controls */}
      <header className={`h-16 px-4 border-b flex items-center justify-between gap-3 shrink-0 z-20 shadow-xs ${themeClasses.header}`}>
        {/* Right Section: Course & Lesson Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center text-emerald-500 shrink-0">
            <Monitor className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-quran px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                وضع العرض التقديمي (معاهد القراءات)
              </span>
              <span className="text-xs text-stone-500 dark:text-slate-400 hidden md:inline">
                {course.shortTitle || course.title}
              </span>
            </div>
            <div className="text-sm font-bold font-quran truncate text-stone-900 dark:text-slate-100 mt-0.5">
              الباب {unit.unitNumber}: {currentLesson.title}
            </div>
          </div>
        </div>

        {/* Center Section: Lesson Switcher Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-black/10 dark:bg-black/30 p-1 rounded-xl border border-black/5 dark:border-white/10 max-w-md overflow-x-auto scrollbar-none">
          {unit.lessons.map((lesson, idx) => {
            const isSelected = idx === activeLessonIdx;
            return (
              <button
                key={lesson.id}
                onClick={() => {
                  setActiveLessonIdx(idx);
                  setActiveSlideIdx(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-quran transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                الدرس 0{lesson.lessonNumber}
              </button>
            );
          })}
        </div>

        {/* Left Section: Display & Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Theme Switcher Button */}
          <button
            onClick={() => {
              const themes: PresentationTheme[] = ['parchment', 'chalkboard', 'dark'];
              const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
              setTheme(themes[nextIdx]);
            }}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-stone-600 dark:text-slate-300 cursor-pointer"
            title={`تغيير نمط العرض: (الحالي: ${theme === 'parchment' ? 'مخطوطة دافئة' : theme === 'chalkboard' ? 'سبورة خضراء' : 'داكن'})`}
          >
            {theme === 'parchment' ? <Sun className="w-4 h-4 text-amber-600" /> : theme === 'chalkboard' ? <Layers className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Font Scaling Button */}
          <button
            onClick={() => {
              const scales: ('normal' | 'large' | 'huge')[] = ['normal', 'large', 'huge'];
              const nextIdx = (scales.indexOf(fontSizeScale) + 1) % scales.length;
              setFontSizeScale(scales[nextIdx]);
            }}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-stone-600 dark:text-slate-300 cursor-pointer font-mono font-bold text-xs"
            title="تكبير حجم الخط لشاشات العرض وقاعات المحاضرات"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Teacher Cue Notes Drawer Toggle */}
          <button
            onClick={() => setShowTeacherNotesDrawer(!showTeacherNotesDrawer)}
            className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
              showTeacherNotesDrawer
                ? 'bg-amber-400/20 text-amber-500 border border-amber-400/30'
                : 'hover:bg-black/10 dark:hover:bg-white/10 text-stone-600 dark:text-slate-300'
            }`}
            title="مفكرة وتوجيهات المعلم للشريحة الحالية"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold hidden sm:inline">توجيه المعلم</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-stone-600 dark:text-slate-300 cursor-pointer"
            title={isFullscreen ? 'الخروج من ملء الشاشة (F)' : 'تفعيل ملء الشاشة الكامل (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Presentation Mode */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-colors cursor-pointer mr-1"
            title="الخروج من العرض التقديمي (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Slide Stage & Interactive Drawing Canvas */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Dynamic Presentation Content Container */}
        <div className="w-full max-w-5xl h-full flex flex-col justify-between z-0 relative overflow-y-auto scrollbar-thin px-2 py-4">
          {/* Slide Category Header */}
          <div className="flex items-center justify-between gap-3 border-b pb-3 mb-4 border-black/10 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                {currentSlide.icon}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  {currentSlide.category}
                </span>
                <h2 className="text-lg sm:text-2xl font-bold font-quran text-stone-900 dark:text-slate-100">
                  {currentSlide.title}
                </h2>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 text-stone-600 dark:text-slate-300">
              الشريحة {activeSlideIdx + 1} من {slides.length}
            </span>
          </div>

          {/* Dynamic Slide Body depending on Slide Type */}
          <div className="flex-1 flex flex-col justify-center my-auto space-y-6">
            {/* 1. Overview Slide */}
            {currentSlide.type === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} text-center space-y-4`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>مقرر معهد القراءات والتجويد المتخصص</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-quran text-emerald-700 dark:text-emerald-400 leading-tight">
                    {currentLesson.title}
                  </h1>

                  <p className="text-base sm:text-xl text-stone-600 dark:text-slate-300 font-tajawal max-w-2xl mx-auto leading-relaxed">
                    {currentLesson.subtitle || unit.subtitle}
                  </p>

                  <div className="pt-4 border-t border-black/10 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                    <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">زمن الشرح التقديري:</div>
                      <div className="text-sm font-bold font-quran text-stone-900 dark:text-slate-100 mt-0.5">
                        {unit.estimatedLectures || 'محاضرة تدريبية'}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">مستوى الطلاب:</div>
                      <div className="text-sm font-bold font-quran text-stone-900 dark:text-slate-100 mt-0.5">
                        {course.levelText || 'متقدم / معاهد القراءات'}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">المهارة المستهدفة:</div>
                      <div className="text-sm font-bold font-quran text-emerald-600 dark:text-emerald-400 mt-0.5">
                        إتقان الأداء والتطبيق الشفهي
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Core Rule Slide */}
            {currentSlide.type === 'rule' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} space-y-6`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-quran px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      📜 الشاهد والضابط النظمي
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400">رواية حفص عن عاصم</span>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400/60 rounded-2xl p-6 text-center shadow-inner">
                    <div className="text-sm text-amber-800 dark:text-amber-300 font-bold mb-2">النص المؤصل المعتمد:</div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold font-quran text-stone-900 dark:text-amber-100 leading-loose">
                      «{unit.title}»
                    </div>
                    <div className="text-sm sm:text-base text-stone-600 dark:text-slate-300 mt-3 font-tajawal">
                      {currentLesson.contentMarkdown?.split('\n\n')[0] || unit.description}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 text-xs sm:text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                    <strong>الضابط المنهجي:</strong> يعتمد طلاب معاهد القراءات على الجمع بين المعرفة النظرية بحدود الحروف ومخارجها، وضبط صفاتها عند التركيب والالتقاء، مع التلقي بالمشافهة من أفواه المشايخ المسندين.
                  </div>
                </div>
              </div>
            )}

            {/* 3. Detailed Explanation Slide */}
            {currentSlide.type === 'explanation' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} space-y-5 max-h-[65vh] overflow-y-auto scrollbar-thin`}>
                  <h3 className="text-xl sm:text-2xl font-bold font-quran text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <span>تأصيل مباحث الدرس</span>
                  </h3>

                  <div className={`${fontSizeClass} font-tajawal text-stone-800 dark:text-slate-200 space-y-4`}>
                    {currentLesson.contentMarkdown ? (
                      currentLesson.contentMarkdown.split('\n\n').slice(0, 4).map((p, pIdx) => (
                        <p key={pIdx} className="leading-relaxed bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10">
                          {p.replace(/^[#*-]\s*/, '')}
                        </p>
                      ))
                    ) : (
                      <p className="text-stone-500">لا يوجد محتوى شرح إضافي لهذا الدرس.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Examples Slide */}
            {currentSlide.type === 'examples' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} space-y-6`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-quran text-stone-900 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span>الشواهد القرآنية للتحليل الصفي المباشر</span>
                    </h3>
                    <span className="text-xs text-stone-500 dark:text-slate-400 font-quran">
                      انقر لاختبار الطلاب وكشف الحكم
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {course.quranExamples && course.quranExamples.length > 0 ? (
                      course.quranExamples.slice(0, 4).map((ex, exIdx) => {
                        const isRevealed = revealedAnswers[exIdx];
                        return (
                          <div
                            key={ex.id || exIdx}
                            className="p-5 rounded-2xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-3 relative group transition-all"
                          >
                            <div className="text-center py-2 px-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-slate-700 shadow-xs">
                              <span className="text-xl sm:text-2xl font-bold font-quran text-emerald-800 dark:text-emerald-300">
                                ﴿ {ex.verseText || ex.word} ﴾
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-slate-400">
                              <span>الموضع: <strong>{ex.surah || 'القرآن الكريم'}</strong></span>
                              <button
                                onClick={() => {
                                  setRevealedAnswers((prev) => ({
                                    ...prev,
                                    [exIdx]: !prev[exIdx],
                                  }));
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center gap-1 transition-colors"
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{isRevealed ? 'إخفاء الحكم' : 'كشف الحكم والتوجيه'}</span>
                              </button>
                            </div>

                            {isRevealed && (
                              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-tajawal animate-fadeIn">
                                <strong>الحكم والتطبيق:</strong> {ex.rule || ex.explanation || 'تطبيق الحكم بدقة مع التحرز من السكت غير الوارد.'}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center p-8 text-stone-500">
                        لا توجد شواهد مخصصة مسجلة في هذا الباب حالياً.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Mind Map Slide */}
            {currentSlide.type === 'mindmap' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} space-y-4`}>
                  <div className="text-center space-y-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                      شجرة التقسيمات والتفريعات
                    </span>
                    <h3 className="text-2xl font-bold font-quran text-stone-900 dark:text-slate-100">
                      {unit.mindMap?.label || unit.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                    {unit.mindMap?.children && unit.mindMap.children.length > 0 ? (
                      unit.mindMap.children.map((child, cIdx) => (
                        <div
                          key={child.id || cIdx}
                          className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2 shadow-xs"
                        >
                          <div className="font-bold font-quran text-indigo-900 dark:text-indigo-200 text-base">
                            {cIdx + 1}. {child.label}
                          </div>
                          {child.children && child.children.length > 0 && (
                            <ul className="text-xs space-y-1 text-stone-600 dark:text-slate-300 list-disc list-inside">
                              {child.children.map((sub, sIdx) => (
                                <li key={sIdx}>{sub.label}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center p-6 text-stone-500">
                        الشجرة المفاهيمية متاحة ضمن دليل الحقيبة التفصيلي.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Exceptions & Mistakes Slide */}
            {currentSlide.type === 'exceptions' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} space-y-5`}>
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold font-quran">
                    <ShieldAlert className="w-5 h-5" />
                    <span>تنبيهات مشايخ القراءات ومواضع اللحن الخفي</span>
                  </div>

                  <div className="space-y-3">
                    {unit.commonMistakes?.map((mistake, mIdx) => (
                      <div
                        key={mistake.id || mIdx}
                        className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                            الخطأ الشائع: {mistake.mistake}
                          </div>
                          <div className="text-xs text-stone-600 dark:text-slate-300">
                            <strong>السبب والتوجيه:</strong> {mistake.reason}
                          </div>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0 font-quran">
                          الصواب: {mistake.correction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. Oral Drill Slide */}
            {currentSlide.type === 'oral' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} space-y-5 text-center`}>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Volume2 className="w-7 h-7" />
                  </div>

                  <h3 className="text-2xl font-bold font-quran text-stone-900 dark:text-slate-100">
                    مهمة التلاوة الشفهية الصفيّة
                  </h3>

                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400/70 max-w-2xl mx-auto shadow-inner">
                    <div className="text-lg sm:text-xl font-bold font-quran text-emerald-900 dark:text-emerald-200 leading-relaxed">
                      {currentLesson.recitationTask}
                    </div>
                  </div>

                  {currentLesson.recitationGuide && (
                    <div className="max-w-xl mx-auto p-4 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-stone-700 dark:text-slate-300 text-right space-y-1">
                      <strong className="text-emerald-600 dark:text-emerald-400">توجيه المعلم للتقييم:</strong>
                      <p>{currentLesson.recitationGuide}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 8. Discussion Slide */}
            {currentSlide.type === 'discussion' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.card} space-y-5`}>
                  <h3 className="text-xl font-bold font-quran text-stone-900 dark:text-slate-100 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                    <span>أسئلة الاستيعاب والحوار التجويدي</span>
                  </h3>

                  <div className="space-y-4">
                    {currentLesson.discussionQuestions?.map((q, qIdx) => {
                      const isRevealed = revealedAnswers[100 + qIdx];
                      const ans = currentLesson.discussionAnswers?.[qIdx] || 'راجع تفصيل الشرح في متن الدرس.';
                      return (
                        <div
                          key={qIdx}
                          className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-base font-bold font-quran text-stone-900 dark:text-slate-100">
                              س{qIdx + 1}: {q}
                            </div>

                            <button
                              onClick={() => {
                                setRevealedAnswers((prev) => ({
                                  ...prev,
                                  [100 + qIdx]: !prev[100 + qIdx],
                                }));
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shrink-0 cursor-pointer transition-colors"
                            >
                              {isRevealed ? 'إخفاء الإجابة' : 'كشف الإجابة'}
                            </button>
                          </div>

                          {isRevealed && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-tajawal animate-fadeIn">
                              <strong>الإجابة النموذجية المعتمدة:</strong> {ans}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 9. Blank Whiteboard Slide */}
            {currentSlide.type === 'whiteboard' && (
              <div className="w-full h-[60vh] rounded-3xl border-2 border-dashed border-black/20 dark:border-white/20 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-black/5 dark:bg-black/20 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-quran text-stone-900 dark:text-slate-100">
                  مساحة التدوين والشرح الحر على السبورة
                </h3>
                <p className="text-sm max-w-md text-stone-500 dark:text-slate-400 font-tajawal">
                  قم بتفعيل «قلم الشرح» من الشريط السفلي لكتابة المسائل أو رسم مخارج الحروف وتوضيح استفسارات طلاب معهد القراءات بحرية تامة.
                </p>
                {!isDrawModeActive && (
                  <button
                    onClick={() => {
                      setIsDrawModeActive(true);
                      setCurrentTool('pen');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-quran cursor-pointer shadow-md transition-colors"
                  >
                    تفعيل قلم الكتابة على السبورة
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Canvas Overlay for Live Drawing & Annotations */}
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={`absolute inset-0 w-full h-full z-10 transition-all ${
            isDrawModeActive
              ? currentTool === 'laser'
                ? 'cursor-none pointer-events-auto'
                : 'cursor-crosshair pointer-events-auto'
              : 'pointer-events-none'
          }`}
        />

        {/* Laser Pointer Glow Effect */}
        {isDrawModeActive && currentTool === 'laser' && laserPosition && (
          <div
            className="absolute z-20 pointer-events-none w-6 h-6 rounded-full bg-rose-500 shadow-[0_0_20px_6px_rgba(244,63,94,0.9)] animate-ping"
            style={{
              left: `${laserPosition.x - 12}px`,
              top: `${laserPosition.y - 12}px`,
            }}
          />
        )}
      </div>

      {/* Floating Teacher's Secret Notes Drawer */}
      {showTeacherNotesDrawer && (
        <aside className={`fixed top-18 bottom-20 left-4 z-40 w-80 sm:w-96 rounded-2xl border shadow-2xl p-5 flex flex-col justify-between animate-fadeIn ${themeClasses.panel}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 text-amber-500 font-bold font-quran">
                <Lightbulb className="w-5 h-5" />
                <span>مفكرة وتوجيهات المعلم للشريحة</span>
              </div>
              <button
                onClick={() => setShowTeacherNotesDrawer(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs sm:text-sm text-stone-800 dark:text-amber-100 leading-relaxed">
              <strong>توجيه إثرائي:</strong>
              <p className="mt-1">{currentSlide.teacherTip || 'حث الطلاب على استحضار الشواهد النظمية أثناء التلاوة العملية.'}</p>
            </div>

            {currentLesson.homeworkTask && (
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-stone-700 dark:text-slate-300 space-y-1">
                <strong>الواجب المنزلي المقرر:</strong>
                <p>{currentLesson.homeworkTask}</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-stone-500 dark:text-slate-400 pt-3 border-t border-black/10 dark:border-white/10 text-center">
            هذه المفكرة مرئية للمعلم فقط لإرشاده أثناء العرض الصفي.
          </div>
        </aside>
      )}

      {/* Floating Slide Jump Carousel / Thumbnails Drawer */}
      {showSlideListDrawer && (
        <aside className={`fixed top-18 bottom-20 right-4 z-40 w-72 sm:w-80 rounded-2xl border shadow-2xl p-4 flex flex-col justify-between animate-fadeIn ${themeClasses.panel}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-black/10 dark:border-white/10">
              <span className="text-xs font-bold font-quran text-stone-800 dark:text-slate-200">
                فهرس شرائح الدرس
              </span>
              <button
                onClick={() => setShowSlideListDrawer(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {slides.map((s, idx) => {
                const isCurrent = idx === activeSlideIdx;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSlideIdx(idx);
                      setShowSlideListDrawer(false);
                    }}
                    className={`w-full text-right p-2.5 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-stone-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="font-mono text-[10px] w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate flex-1">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      )}

      {/* Bottom Floating Presentation Toolbar: Slide Navigation & Pen Tools Suite */}
      <footer className={`h-20 px-4 border-t flex items-center justify-between gap-2 shrink-0 z-20 shadow-md ${themeClasses.footer}`}>
        {/* Previous Slide Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSlideIdx((prev) => Math.max(prev - 1, 0))}
            disabled={activeSlideIdx === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSlideIdx === 0
                ? 'opacity-40 cursor-not-allowed text-stone-400'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-stone-800 dark:text-slate-100 shadow-xs'
            }`}
            title="الشريحة السابقة (السهم الأيمن)"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">السابق</span>
          </button>

          {/* Quick Slides Jumper Button */}
          <button
            onClick={() => setShowSlideListDrawer(!showSlideListDrawer)}
            className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-stone-800 dark:text-slate-100 text-xs font-bold font-quran flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="قائمة الشرائح والانتقال السريع"
          >
            <span>{activeSlideIdx + 1} / {slides.length}</span>
          </button>

          {/* Next Slide Button */}
          <button
            onClick={() => setActiveSlideIdx((prev) => Math.min(prev + 1, slides.length - 1))}
            disabled={activeSlideIdx === slides.length - 1}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSlideIdx === slides.length - 1
                ? 'opacity-40 cursor-not-allowed text-stone-400'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
            title="الشريحة التالية (المسافة أو السهم الأيسر)"
          >
            <span className="hidden sm:inline">التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Live Drawing Tools Palette */}
        <div className="flex items-center gap-1 sm:gap-2 bg-black/5 dark:bg-black/40 p-1.5 rounded-2xl border border-black/10 dark:border-white/10">
          {/* Mode Toggle: Interact (Mouse) vs Drawing (Pen) */}
          <button
            onClick={() => setIsDrawModeActive(false)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              !isDrawModeActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="وضع التصفح والتفاعل الصفي (النقر على الأزرار)"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-black/10 dark:bg-white/10" />

          {/* Pen Tool */}
          <button
            onClick={() => {
              setIsDrawModeActive(true);
              setCurrentTool('pen');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDrawModeActive && currentTool === 'pen'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="قلم الشرح والتدوين الحر (P)"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Highlighter Tool */}
          <button
            onClick={() => {
              setIsDrawModeActive(true);
              setCurrentTool('highlighter');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDrawModeActive && currentTool === 'highlighter'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="قلم التمييز والتظليل الفسفوري للكلمات والحروف (H)"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Laser Pointer Tool */}
          <button
            onClick={() => {
              setIsDrawModeActive(true);
              setCurrentTool('laser');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDrawModeActive && currentTool === 'laser'
                ? 'bg-rose-500 text-white font-bold shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="مؤشر الليزر التفاعلي لتوجيه نظر الطلاب (L)"
          >
            <Target className="w-4 h-4" />
          </button>

          {/* Box / Frame Tool */}
          <button
            onClick={() => {
              setIsDrawModeActive(true);
              setCurrentTool('box');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer hidden md:flex ${
              isDrawModeActive && currentTool === 'box'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="أداة التأطير والمربعات لتحديد الكلمات القرآنية"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Arrow Tool */}
          <button
            onClick={() => {
              setIsDrawModeActive(true);
              setCurrentTool('arrow');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer hidden md:flex ${
              isDrawModeActive && currentTool === 'arrow'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="سهم التوجيه والإشارة"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => {
              setIsDrawModeActive(true);
              setCurrentTool('eraser');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDrawModeActive && currentTool === 'eraser'
                ? 'bg-slate-700 text-white font-bold shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="الممحاة (E)"
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* Color Palettes (When Drawing is Active) */}
          {isDrawModeActive && (
            <div className="flex items-center gap-1 pr-2 border-r border-black/10 dark:border-white/10">
              {[
                { color: '#ef4444', label: 'أحمر قاني' },
                { color: '#10b981', label: 'أخضر تجويدي' },
                { color: '#f59e0b', label: 'ذهبي عنبري' },
                { color: '#0ea5e9', label: 'أزرق سماوي' },
                { color: '#ffffff', label: 'أبيض' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setStrokeColor(c.color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                    strokeColor === c.color ? 'scale-125 border-stone-900 dark:border-white shadow-xs' : 'border-black/20'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Utility: Undo, Redo, Clear, Export */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={!slideDrawings[slideKey] || slideDrawings[slideKey].length === 0}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-stone-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="تراجع عن آخر رسمة"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={!slideRedoStacks[slideKey] || slideRedoStacks[slideKey].length === 0}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-stone-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="إعادة الرسمة"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearSlideCanvas}
            className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-500 cursor-pointer"
            title="مسح جميع رسومات هذه الشريحة"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportSlideImage}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-stone-600 dark:text-slate-300 cursor-pointer hidden sm:flex"
            title="تحميل لقطة الشريحة مع شروحات القلم لمشاركتها مع الطلاب"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
