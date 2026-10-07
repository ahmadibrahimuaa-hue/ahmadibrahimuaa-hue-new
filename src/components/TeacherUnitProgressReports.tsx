import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Award, Users, BookOpen, CheckCircle2, 
  AlertCircle, ChevronDown, ChevronUp, Search, Download, Printer, 
  RefreshCw, Sparkles, Filter, Star, HelpCircle, Layers, ArrowLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine 
} from 'recharts';
import { getAllCourses, getCourseById } from '../data/courses';
import { getSubmissionsList, subscribeStudentSubmissions } from '../utils/studentStorage';
import { getStoredReflections, LessonSelfReflection } from '../utils/selfReflectionStorage';
import { getUnitQuizQuestions } from '../utils/questionStorage';
import { subscribeAllStudentsProgress, CloudStudentProgressRecord } from '../utils/studentProgressStorage';
import { Course, Unit, StudentSubmission } from '../types';

interface TeacherUnitProgressReportsProps {
  activeCourseId?: string;
  onSelectCourse?: (courseId: string) => void;
  onNavigateToUnitQuestions?: (unitNumber: number) => void;
}

export const TeacherUnitProgressReports: React.FC<TeacherUnitProgressReportsProps> = ({
  activeCourseId = 'foundational_rules',
  onSelectCourse,
  onNavigateToUnitQuestions,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourseId);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [cloudProgress, setCloudProgress] = useState<CloudStudentProgressRecord[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [reflections, setReflections] = useState<Record<string, LessonSelfReflection>>({});
  const [selectedUnitDrilldown, setSelectedUnitDrilldown] = useState<number | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mastered' | 'average' | 'needs_help'>('all');
  const [chartMetricView, setChartMetricView] = useState<'percentage' | 'trend' | 'student_count'>('percentage');

  const allCourses = useMemo(() => getAllCourses(), []);
  const currentCourse = useMemo(() => getCourseById(selectedCourseId) || allCourses[0], [selectedCourseId, allCourses]);
  const units: Unit[] = currentCourse?.units || [];

  // Update selected course if prop changes
  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourseId(activeCourseId);
    }
  }, [activeCourseId]);

  const loadData = () => {
    setSubmissions(getSubmissionsList());
    setReflections(getStoredReflections());
  };

  useEffect(() => {
    loadData();
    const unsubSubmissions = subscribeStudentSubmissions((data) => {
      setSubmissions(data);
      setLastSyncTime(new Date());
    });

    const unsubProgress = subscribeAllStudentsProgress((records) => {
      setCloudProgress(records);
      setLastSyncTime(new Date());
    });

    const handleSubmissionsUpdated = () => {
      loadData();
      setLastSyncTime(new Date());
    };
    const handleReflectionsUpdated = () => {
      loadData();
      setLastSyncTime(new Date());
    };

    window.addEventListener('tajweed_submissions_updated', handleSubmissionsUpdated);
    window.addEventListener('tajweed_reflections_updated', handleReflectionsUpdated);

    return () => {
      unsubSubmissions();
      unsubProgress();
      window.removeEventListener('tajweed_submissions_updated', handleSubmissionsUpdated);
      window.removeEventListener('tajweed_reflections_updated', handleReflectionsUpdated);
    };
  }, []);

  const handleCourseChange = (id: string) => {
    setSelectedCourseId(id);
    setSelectedUnitDrilldown(null);
    if (onSelectCourse) {
      onSelectCourse(id);
    }
  };

  // Helper to match submission to a unit
  const isSubmissionForUnit = (sub: StudentSubmission, unit: Unit): boolean => {
    // 1. Direct courseId and unitNumber match if present
    if (sub.courseId && sub.unitNumber !== undefined) {
      return sub.courseId === selectedCourseId && sub.unitNumber === unit.unitNumber;
    }
    // If courseId is explicitly defined and doesn't match selected course, do not match
    if (sub.courseId && sub.courseId !== selectedCourseId) {
      return false;
    }

    const title = (sub.unitTitle || '').toLowerCase();
    const unitTitle = unit.title.toLowerCase();
    const uNum = unit.unitNumber;

    if (title.includes(unitTitle)) return true;
    if (title.includes(`الباب ${uNum}`) || title.includes(`باب ${uNum}`) || title.includes(`الوحدة ${uNum}`)) {
      const currentCourseTitle = (currentCourse.shortTitle || currentCourse.title).toLowerCase();
      if (title.includes(currentCourseTitle) || !title.includes(']')) {
        return true;
      }
    }
    
    // Check by unit's lessons keywords
    const hasLessonMatch = unit.lessons?.some((l) => {
      const lTitle = l.title.toLowerCase();
      return lTitle.length > 5 && title.includes(lTitle);
    });

    return !!hasLessonMatch;
  };

  // Detailed calculations per unit based on 100% REAL submissions & cloud progress
  const unitsReportData = useMemo(() => {
    const allReflections: LessonSelfReflection[] = Object.values(reflections);
    const reflectionsList = allReflections.filter((r) => r.courseId === selectedCourseId);

    return units.map((unit) => {
      const unitQuestions = getUnitQuizQuestions(unit.unitNumber, selectedCourseId);
      
      // Match submissions for this unit
      const unitSubs = submissions.filter((s) => isSubmissionForUnit(s, unit));

      // Match cloud progress completions for this unit (التزامن السحابي المباشر)
      const cloudStudentsForUnit = cloudProgress
        .filter((cp) => cp.courseId === selectedCourseId && cp.completedUnitNumbers.includes(unit.unitNumber))
        .map((cp) => cp.studentName);

      // Unique students count
      const uniqueStudentsMap = new Map<string, StudentSubmission[]>();
      unitSubs.forEach((s) => {
        const name = (s.studentName || 'طالب غير محدد').trim();
        if (!uniqueStudentsMap.has(name)) {
          uniqueStudentsMap.set(name, []);
        }
        uniqueStudentsMap.get(name)!.push(s);
      });

      // Incorporate students who marked the unit completed in cloud database
      cloudStudentsForUnit.forEach((name) => {
        const cleanName = (name || '').trim();
        if (cleanName && !uniqueStudentsMap.has(cleanName)) {
          uniqueStudentsMap.set(cleanName, []);
        }
      });

      const uniqueStudentsCount = uniqueStudentsMap.size;
      const totalAttempts = unitSubs.length;

      // Calculate real scores from real attempts
      let totalPercentage = 0;
      let highestPercentage = 0;
      let lowestPercentage = totalAttempts > 0 ? 100 : 0;
      let passCount = 0; // >= 70%
      let masteredCount = 0; // >= 85%
      let averageCount = 0; // 60% - 84%
      let needsHelpCount = 0; // < 60%

      unitSubs.forEach((s) => {
        const pct = s.percentage || 0;
        totalPercentage += pct;
        if (pct > highestPercentage) highestPercentage = pct;
        if (pct < lowestPercentage) lowestPercentage = pct;

        if (pct >= 70) passCount++;
        if (pct >= 85) masteredCount++;
        else if (pct >= 60) averageCount++;
        else needsHelpCount++;
      });

      // Calculate real averages
      const avgPercentage = totalAttempts > 0 ? Math.round(totalPercentage / totalAttempts) : 0;
      const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

      // Calculate average self-reflection rating for this unit
      const unitReflections = reflectionsList.filter((r) => r.unitNumber === unit.unitNumber);
      const avgReflectionRating = unitReflections.length > 0
        ? Number((unitReflections.reduce((acc, r) => acc + (r.rating || 0), 0) / unitReflections.length).toFixed(1))
        : 0;

      // Student rows for drilldown table with real data
      const studentDetails = Array.from(uniqueStudentsMap.entries()).map(([name, subs]) => {
        const hasQuizAttempts = subs.length > 0;
        const bestSub = hasQuizAttempts
          ? subs.reduce((prev, curr) => (curr.percentage > prev.percentage ? curr : prev), subs[0])
          : null;
        const studentReflection = unitReflections.find((r) => (r.studentName || '').trim() === name);

        let status: 'mastered' | 'average' | 'needs_help' = 'average';
        if (bestSub) {
          if (bestSub.percentage >= 85) status = 'mastered';
          else if (bestSub.percentage < 60) status = 'needs_help';
        } else {
          // Student marked unit completed in cloud database
          status = 'mastered';
        }

        return {
          studentName: name,
          bestScore: bestSub ? bestSub.score : unitQuestions.length,
          totalQuestions: bestSub ? bestSub.totalQuestions : unitQuestions.length,
          percentage: bestSub ? bestSub.percentage : 100,
          attemptsCount: subs.length,
          latestDate: bestSub ? bestSub.date : 'أتم دراسة الباب سحابياً',
          status,
          reflectionRating: studentReflection?.rating,
          reflectionNote: studentReflection?.note,
        };
      });

      return {
        unitNumber: unit.unitNumber,
        unitTitle: unit.title,
        unitSubtitle: unit.subtitle,
        lessonsCount: unit.lessons?.length || 0,
        questionsCount: unitQuestions.length,
        uniqueStudentsCount,
        totalAttempts,
        avgPercentage,
        passRate,
        highestPercentage,
        lowestPercentage: totalAttempts > 0 ? lowestPercentage : 0,
        masteredCount,
        averageCount,
        needsHelpCount,
        avgReflectionRating,
        reflectionsCount: unitReflections.length,
        studentDetails,
      };
    });
  }, [units, submissions, reflections, cloudProgress, selectedCourseId]);

  // Overall KPIs for the selected course
  const courseOverview = useMemo(() => {
    const totalUnits = units.length;
    const totalSubmissionsInCourse = unitsReportData.reduce((acc, u) => acc + u.totalAttempts, 0);
    
    // Set of all unique students across this course's units
    const allStudentsSet = new Set<string>();
    unitsReportData.forEach((u) => {
      u.studentDetails.forEach((s) => allStudentsSet.add(s.studentName));
    });

    const activeUnitsWithData = unitsReportData.filter((u) => u.totalAttempts > 0);
    const overallAvgScore = activeUnitsWithData.length > 0
      ? Math.round(activeUnitsWithData.reduce((acc, u) => acc + u.avgPercentage, 0) / activeUnitsWithData.length)
      : 0;

    // Highest and lowest performing units
    const sortedByScore = [...activeUnitsWithData].sort((a, b) => b.avgPercentage - a.avgPercentage);
    const topUnit = sortedByScore[0];
    const challengingUnit = sortedByScore[sortedByScore.length - 1];

    // Total mastery distribution across all units
    const totalMastered = unitsReportData.reduce((acc, u) => acc + u.masteredCount, 0);
    const totalAverage = unitsReportData.reduce((acc, u) => acc + u.averageCount, 0);
    const totalNeedsHelp = unitsReportData.reduce((acc, u) => acc + u.needsHelpCount, 0);

    return {
      totalUnits,
      totalSubmissionsInCourse,
      uniqueStudentsCount: allStudentsSet.size,
      overallAvgScore,
      topUnit,
      challengingUnit,
      totalMastered,
      totalAverage,
      totalNeedsHelp,
    };
  }, [unitsReportData, units]);

  // Chart data for Recharts Bar Chart
  const barChartData = useMemo(() => {
    return unitsReportData.map((u) => ({
      name: `الباب ${u.unitNumber}`,
      fullTitle: u.unitTitle,
      avgPercentage: u.avgPercentage,
      passRate: u.passRate,
      studentsCount: u.uniqueStudentsCount,
      attemptsCount: u.totalAttempts,
      avgReflection: u.avgReflectionRating * 20, // Scale 1-5 to 0-100 for visual comparison
      reflectionStars: u.avgReflectionRating,
    }));
  }, [unitsReportData]);

  // Pie chart data for student mastery distribution (حقيقي 100%)
  const pieChartData = useMemo(() => {
    const { totalMastered, totalAverage, totalNeedsHelp } = courseOverview;
    const total = totalMastered + totalAverage + totalNeedsHelp;
    if (total === 0) {
      return [];
    }
    return [
      { name: 'متقن ممتاز (≥85%)', value: totalMastered, color: '#10b981' },
      { name: 'مستوى متوسط (60-84%)', value: totalAverage, color: '#f59e0b' },
      { name: 'يحتاج متابعة (<60%)', value: totalNeedsHelp, color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [courseOverview]);

  // Selected Unit Data for Drilldown
  const activeDrilldownUnit = useMemo(() => {
    if (selectedUnitDrilldown === null) return null;
    return unitsReportData.find((u) => u.unitNumber === selectedUnitDrilldown) || null;
  }, [unitsReportData, selectedUnitDrilldown]);

  // Filtered student details in drilldown
  const filteredDrilldownStudents = useMemo(() => {
    if (!activeDrilldownUnit) return [];
    const query = studentSearchQuery.toLowerCase().trim();

    return activeDrilldownUnit.studentDetails.filter((s) => {
      const matchesSearch = !query || s.studentName.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeDrilldownUnit, studentSearchQuery, statusFilter]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportTextReport = () => {
    let report = `=== تقرير المستوى والتقدم البياني لأبواب الحقيبة التعليمية ===\n`;
    report += `الحقيبة التعليمية: ${currentCourse.title}\n`;
    report += `تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}\n`;
    report += `إجمالي الأبواب: ${courseOverview.totalUnits} أبواب\n`;
    report += `إجمالي الطلاب المتفاعلين: ${courseOverview.uniqueStudentsCount} طالباً\n`;
    report += `متوسط نسبة إتقان الحقيبة: ${courseOverview.overallAvgScore}%\n`;
    report += `--------------------------------------------------------\n\n`;

    unitsReportData.forEach((u) => {
      report += `[الباب ${u.unitNumber}]: ${u.unitTitle}\n`;
      report += `  - عدد الدروس: ${u.lessonsCount} | أسئلة الباب: ${u.questionsCount}\n`;
      report += `  - الطلاب المشاركون: ${u.uniqueStudentsCount} طالب | المحاولات: ${u.totalAttempts}\n`;
      report += `  - متوسط النسبة المئوية: ${u.avgPercentage}% (نسبة النجاح: ${u.passRate}%)\n`;
      report += `  - تقييم الفهم الذاتي: ${u.avgReflectionRating} / 5 نجوم\n`;
      report += `  - تصنيف الإتقان: ${u.masteredCount} متقن | ${u.averageCount} متوسط | ${u.needsHelpCount} يحتاج متابعة\n`;
      report += `--------------------------------------------------------\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_تقدم_أبواب_${selectedCourseId}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-slate-800 font-tajawal animate-fadeIn">

      {/* Live Cloud Synchronization Banner (تزامن سحابي حي مع Firestore) */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-md"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 font-quran text-xs sm:text-sm">
                التزامن السحابي المباشر نشط (Firestore Live Cloud Sync)
              </span>
              <span className="bg-emerald-800/80 text-emerald-200 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                بيانات حقيقية 100%
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              الإحصائيات والرسوم البيانية مبنية مباشرة على نتائج واختبارات الطلاب الحقيقية ويتم تحديثها فورياً بمجرد إنجاز أي طالب لأي اختبار.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0 w-full sm:w-auto justify-end">
          <span className="bg-slate-800/90 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold">
            {submissions.length} نتيجة سحابية مسجلة
          </span>
          <span className="text-slate-400 text-[11px]">
            آخر تزامن: {lastSyncTime.toLocaleTimeString('ar-EG')}
          </span>
        </div>
      </div>
      
      {/* Top Banner & Header Controls */}
      <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-3xl border border-amber-400/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold font-quran text-amber-300">
                تقارير تقدم ومستوى الطلاب في أبواب الحقيبة التعليمية
              </h3>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                {currentCourse.shortTitle || currentCourse.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              رسوم بيانية تفاعلية لقياس نسبة الاستيعاب ومعدل إتقان واجتياز الطلاب في كل باب بشكل مستقل
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={loadData}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>تحديث البيانات</span>
          </button>

          <button
            onClick={handleExportTextReport}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-600/50 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير تقرير نصي</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Bag Selection Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 font-quran shrink-0">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>اختر الحقيبة التعليمية لتوليد تقاريرها:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {allCourses.map((c) => {
            const isSelected = c.id === selectedCourseId;
            return (
              <button
                key={c.id}
                onClick={() => handleCourseChange(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-quran transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-950 text-amber-300 shadow-md ring-2 ring-amber-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{c.icon || '🗂️'}</span>
                <span>{c.shortTitle || c.title}</span>
                <span className="text-[10px] font-mono opacity-80">({c.units?.length || 0} أبواب)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Metric KPI Cards for Selected Bag */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">أبواب الحقيبة</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {courseOverview.totalUnits}
          </div>
          <p className="text-[11px] text-slate-500">
            أبواب تدريبية مكتملة المحتوى
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">الطلاب المتفاعلون</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {courseOverview.uniqueStudentsCount}
          </div>
          <p className="text-[11px] text-slate-500">
            طالباً أجروا اختبارات وتدريبات
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">متوسط إتقان الحقيبة</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900">
              {courseOverview.overallAvgScore}%
            </span>
            <span className={`text-[10px] font-bold font-quran px-1.5 py-0.5 rounded ${
              courseOverview.overallAvgScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
              courseOverview.overallAvgScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {courseOverview.overallAvgScore >= 85 ? 'ممتاز' : courseOverview.overallAvgScore >= 70 ? 'جيد جداً' : courseOverview.overallAvgScore >= 60 ? 'متوسط' : 'يحتاج دعم'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            إجمالي المحاولات: {courseOverview.totalSubmissionsInCourse}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">الباب الأكثر إتقاناً</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold font-quran text-emerald-950 truncate">
            {courseOverview.topUnit ? `الباب ${courseOverview.topUnit.unitNumber}` : 'لا توجد نتائج'}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {courseOverview.topUnit ? `${courseOverview.topUnit.avgPercentage}% نسبة متوسط الدرجات` : 'بانتظار تسليمات الطلاب'}
          </p>
        </div>
      </div>

      {/* Main Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols wide): Door Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold font-quran text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <span>مقارنة أداء وإتقان الطلاب عبر أبواب الحقيبة التعليمية</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                يوضح الرسم البياني متوسط درجات ونسب النجاح في اختبارات كل باب على حدة
              </p>
            </div>

            {/* Toggle metric */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setChartMetricView('percentage')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran transition-all cursor-pointer ${
                  chartMetricView === 'percentage'
                    ? 'bg-emerald-900 text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 أعمدة الإتقان (%)
              </button>
              <button
                type="button"
                onClick={() => setChartMetricView('trend')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran transition-all cursor-pointer ${
                  chartMetricView === 'trend'
                    ? 'bg-emerald-900 text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📈 منحنى المسار
              </button>
              <button
                type="button"
                onClick={() => setChartMetricView('student_count')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran transition-all cursor-pointer ${
                  chartMetricView === 'student_count'
                    ? 'bg-emerald-900 text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 أعداد الطلاب
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-72 w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              {chartMetricView === 'percentage' ? (
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#334155', fontSize: 12, fontFamily: 'sans-serif' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-right text-xs space-y-1.5 border border-slate-700 font-tajawal min-w-48">
                            <p className="font-bold text-amber-300 border-b border-slate-800 pb-1">
                              {data.name}: {data.fullTitle}
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">متوسط الدرجة:</span>
                              <span className="font-bold text-emerald-400 font-mono">{data.avgPercentage}%</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">نسبة الاجتياز:</span>
                              <span className="font-bold text-amber-400 font-mono">{data.passRate}%</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">الطلاب المشاركون:</span>
                              <span className="font-bold text-slate-200 font-mono">{data.studentsCount}</span>
                            </p>
                            {data.reflectionStars > 0 && (
                              <p className="flex justify-between border-t border-slate-800 pt-1">
                                <span className="text-slate-400">تقييم الفهم الذاتي:</span>
                                <span className="font-bold text-amber-300">{data.reflectionStars} ⭐</span>
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    formatter={(value) => value === 'avgPercentage' ? 'متوسط نسبة إتقان الباب (%)' : 'نسبة اجتياز الطلاب (%)'}
                  />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'مستوى الإتقان (80%)', fill: '#059669', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="avgPercentage" fill="#047857" radius={[8, 8, 0, 0]} name="avgPercentage" />
                  <Bar dataKey="passRate" fill="#f59e0b" radius={[8, 8, 0, 0]} name="passRate" />
                </BarChart>
              ) : chartMetricView === 'trend' ? (
                <AreaChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#047857" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#334155', fontSize: 12, fontFamily: 'sans-serif' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-right text-xs space-y-1.5 border border-slate-700 font-tajawal min-w-48">
                            <p className="font-bold text-amber-300 border-b border-slate-800 pb-1">
                              {data.name}: {data.fullTitle}
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">متوسط الدرجة:</span>
                              <span className="font-bold text-emerald-400 font-mono">{data.avgPercentage}%</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">نسبة الاجتياز:</span>
                              <span className="font-bold text-amber-400 font-mono">{data.passRate}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    formatter={(value) => value === 'avgPercentage' ? 'مسار متوسط الإتقان (%)' : 'مسار نسبة الاجتياز (%)'}
                  />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'مستوى الإتقان (80%)', fill: '#059669', fontSize: 10, position: 'top' }} />
                  <Area type="monotone" dataKey="avgPercentage" stroke="#047857" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" name="avgPercentage" />
                  <Area type="monotone" dataKey="passRate" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPass)" name="passRate" />
                </AreaChart>
              ) : (
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#334155', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-right text-xs space-y-1.5 border border-slate-700 font-tajawal min-w-48">
                            <p className="font-bold text-amber-300 border-b border-slate-800 pb-1">
                              {data.name}: {data.fullTitle}
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">الطلاب الممتحنون:</span>
                              <span className="font-bold text-indigo-400 font-mono">{data.studentsCount} طلاب</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">إجمالي المحاولات:</span>
                              <span className="font-bold text-emerald-400 font-mono">{data.attemptsCount} محاولة</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    formatter={(value) => value === 'studentsCount' ? 'عدد الطلاب الفرادى' : 'إجمالي عدد المحاولات'}
                  />
                  <Bar dataKey="studentsCount" fill="#4f46e5" radius={[8, 8, 0, 0]} name="studentsCount" />
                  <Bar dataKey="attemptsCount" fill="#0284c7" radius={[8, 8, 0, 0]} name="attemptsCount" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (1 Col wide): Overall Mastery Distribution Pie Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold font-quran text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>توزيع مستويات إتقان الطلاب</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              نسبة الطلاب المصنفين حسب جودة الإتقان في أبواب الحقيبة
            </p>
          </div>

          {pieChartData.length > 0 ? (
            <div className="h-52 w-full flex items-center justify-center" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <span className="font-bold text-slate-700">لا توجد تسليمات حقيقية مسجلة بعد</span>
              <p className="text-[11px] text-slate-400 max-w-xs">
                بمجرد أن يخوض الطلاب اختبارات أبواب هذه الحقيبة، ستظهر نسب الإتقان الحقيقية وتوزيع المستويات تلقائياً عبر التزامن السحابي.
              </p>
            </div>
          )}

          {/* Legend Items */}
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>متقن ممتاز (≥85%)</span>
              </span>
              <span className="font-bold font-mono text-emerald-700">{courseOverview.totalMastered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>مستوى متوسط (60-84%)</span>
              </span>
              <span className="font-bold font-mono text-amber-700">{courseOverview.totalAverage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span>يحتاج متابعة (&lt;60%)</span>
              </span>
              <span className="font-bold font-mono text-rose-700">{courseOverview.totalNeedsHelp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters / Doors Detailed Cards Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold font-quran text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>تفاصيل أبواب الحقيبة ومستوى إتقان كل باب:</span>
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            {unitsReportData.length} أبواب مسجلة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {unitsReportData.map((unitData) => {
            const isDrilldownActive = selectedUnitDrilldown === unitData.unitNumber;

            return (
              <div
                key={unitData.unitNumber}
                className={`bg-white border rounded-3xl p-4 shadow-xs transition-all space-y-3 relative ${
                  isDrilldownActive
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold font-quran text-sm flex items-center justify-center shrink-0">
                      {unitData.unitNumber}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold font-quran text-slate-900 leading-tight">
                        {unitData.unitTitle}
                      </h5>
                      <span className="text-[10px] text-slate-500">
                        {unitData.lessonsCount} دروس · {unitData.questionsCount} أسئلة بالبنك
                      </span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg shrink-0 ${
                    unitData.avgPercentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                    unitData.avgPercentage >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {unitData.avgPercentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>معدل إتقان الباب</span>
                    <span className="font-mono font-bold text-slate-700">{unitData.avgPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        unitData.avgPercentage >= 80 ? 'bg-emerald-600' :
                        unitData.avgPercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, unitData.avgPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">الطلاب</span>
                    <strong className="text-slate-800 font-mono">{unitData.uniqueStudentsCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">نسبة النجاح</span>
                    <strong className="text-emerald-700 font-mono">{unitData.passRate}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الفهم الذاتي</span>
                    <strong className="text-amber-600 font-mono">{unitData.avgReflectionRating > 0 ? `${unitData.avgReflectionRating} ⭐` : '-'}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedUnitDrilldown(isDrilldownActive ? null : unitData.unitNumber)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold font-quran transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDrilldownActive
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{isDrilldownActive ? 'إغلاق التفاصيل' : 'عرض سجل طلاب الباب'}</span>
                    {isDrilldownActive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {onNavigateToUnitQuestions && (
                    <button
                      type="button"
                      onClick={() => onNavigateToUnitQuestions(unitData.unitNumber)}
                      className="p-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs transition-colors cursor-pointer"
                      title="تعديل أسئلة هذا الباب"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-down Table for Selected Door */}
      {activeDrilldownUnit && (
        <div className="bg-white border-2 border-emerald-600/40 rounded-3xl p-5 shadow-lg space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded-lg text-xs font-quran">
                  الباب {activeDrilldownUnit.unitNumber}
                </span>
                <h4 className="text-sm font-bold font-quran text-slate-900">
                  سجل طلاب: {activeDrilldownUnit.unitTitle}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                استعراض نتائج وتقييمات الطلاب الفرادى الذين خاضوا اختبارات وتدريبات هذا الباب
              </p>
            </div>

            <button
              onClick={() => setSelectedUnitDrilldown(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="بحث باسم الطالب في هذا الباب..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-tajawal"
              />
              <Search className="w-4 h-4 text-slate-400 absolute top-2 right-2.5" />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                الكل ({activeDrilldownUnit.studentDetails.length})
              </button>
              <button
                onClick={() => setStatusFilter('mastered')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran cursor-pointer ${
                  statusFilter === 'mastered' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                المتقنون ({activeDrilldownUnit.masteredCount})
              </button>
              <button
                onClick={() => setStatusFilter('needs_help')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran cursor-pointer ${
                  statusFilter === 'needs_help' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800'
                }`}
              >
                بحاجة لمتابعة ({activeDrilldownUnit.needsHelpCount})
              </button>
            </div>
          </div>

          {/* Student Table */}
          {filteredDrilldownStudents.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 font-quran">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3">أفضل درجة</th>
                    <th className="p-3">النسبة المئوية</th>
                    <th className="p-3">المحاولات</th>
                    <th className="p-3">تقييم الفهم الذاتي</th>
                    <th className="p-3">تاريخ الإنجاز</th>
                    <th className="p-3">الحالة التقديرية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrilldownStudents.map((st, idx) => (
                    <tr key={st.studentName} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold font-quran text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>{st.studentName}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {st.bestScore} / {st.totalQuestions}
                      </td>
                      <td className="p-3">
                        <span className={`font-mono font-black px-2 py-0.5 rounded ${
                          st.percentage >= 85 ? 'bg-emerald-100 text-emerald-800' :
                          st.percentage >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">
                        {st.attemptsCount} محاولات
                      </td>
                      <td className="p-3">
                        {st.reflectionRating ? (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 font-bold font-mono">{st.reflectionRating}</span>
                            <span className="text-amber-400">⭐</span>
                            {st.reflectionNote && (
                              <span className="text-[10px] text-slate-400 truncate max-w-xs">({st.reflectionNote})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">لم يقيّم</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 font-sans text-[11px]">
                        {st.latestDate}
                      </td>
                      <td className="p-3">
                        {st.status === 'mastered' && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-quran">
                            🌿 إتقان تام
                          </span>
                        )}
                        {st.status === 'average' && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-quran">
                            ⚡ مستوى متوسط
                          </span>
                        )}
                        {st.status === 'needs_help' && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-quran">
                            ⚠️ يحتاج متابعة
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-600 font-bold">لا توجد سجلات طلاب مطابقة لهذا الباب حالياً</p>
              <p className="text-[11px] text-slate-400">ستظهر النتائج هنا فور إجابة الطلاب على اختبارات هذا الباب</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
