import React, { useState, useEffect, useRef } from 'react';
import { Course, GroupThemeConfig } from '../types';
import { getAllCourses } from '../data/courses';
import { isCourseUnlocked } from '../utils/studentProgressStorage';
import { 
  Menu, X, BookOpen, Trophy, Moon, Sun, Search, Share2, 
  LogOut, Settings, Briefcase, Type, Award, ChevronDown, 
  Grid, ShieldCheck, Lock, Users, Sparkles, Palette
} from 'lucide-react';
import { WhatsAppSupport } from './WhatsAppSupport';
import { getActiveThemeForStudent, subscribeGroupThemes } from '../utils/groupThemeStorage';
import { getStudentProfile, subscribeStudentProfile } from '../utils/studentStorage';
import { getHomeConfig, subscribeHomeConfig, HomeConfig } from '../utils/homeConfigStorage';
import { InstituteLogo } from './InstituteLogo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeCourse: Course;
  onSelectCourse: (courseId: string) => void;
  onReturnToHome: () => void;
  isExamActive?: boolean;
  isTeacherMode: boolean;
  setIsTeacherMode: (val: boolean) => void;
  onUnlockTeacherModal: () => void;
  onOpenTeacherDashboard: () => void;
  onOpenCertificateEditor?: () => void;
  onOpenBagManagement?: () => void;
  onOpenFontModal?: () => void;
  onOpenSearch?: () => void;
  onOpenShareModal?: () => void;
  onLogoutStudent?: () => void;
  studentName?: string;
  isNightMode: boolean;
  setIsNightMode: (val: boolean) => void;
  onOpenProgressModal: () => void;
  progressPercentage: number;
  completedUnitsCount?: number;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  currentSectionTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  activeCourse,
  onSelectCourse,
  onReturnToHome,
  isExamActive = false,
  isTeacherMode, 
  setIsTeacherMode,
  onUnlockTeacherModal,
  onOpenTeacherDashboard,
  onOpenCertificateEditor,
  onOpenBagManagement,
  onOpenFontModal,
  onOpenSearch,
  onOpenShareModal,
  onLogoutStudent,
  studentName,
  isNightMode,
  setIsNightMode,
  onOpenProgressModal,
  progressPercentage,
  completedUnitsCount = 0,
  onToggleSidebar,
  isSidebarOpen = false,
  currentSectionTitle,
}) => {
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  const [homeConfig, setHomeConfig] = useState<HomeConfig>(() => getHomeConfig());

  useEffect(() => {
    const unsubHome = subscribeHomeConfig((cfg) => {
      setHomeConfig(cfg);
    });
    return () => unsubHome();
  }, []);

  const [activeTheme, setActiveTheme] = useState<GroupThemeConfig | null>(() => {
    return getActiveThemeForStudent(getStudentProfile()?.group);
  });

  useEffect(() => {
    const unsubProf = subscribeStudentProfile((p) => {
      setActiveTheme(getActiveThemeForStudent(p?.group));
    });
    const unsubThemes = subscribeGroupThemes(() => {
      setActiveTheme(getActiveThemeForStudent(getStudentProfile()?.group));
    });
    return () => {
      unsubProf();
      unsubThemes();
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(target)) {
        setShowCourseDropdown(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(target)) {
        setShowToolsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Human-readable tab titles
  const getTabLabel = (tabId: string) => {
    switch (tabId) {
      case 'cover': return 'غلاف الحقيبة والتقديم';
      case 'units': return 'الكتاب التدريبي والدروس';
      case 'examples': return 'المختبر القرآني للأمثلة';
      case 'exceptions': return 'الكلمات المستثناة';
      case 'errors': return 'أخطاء القراء والتصحيح';
      case 'summary': return 'جدول المقارنة الشامل';
      case 'exam': return 'الاختبار النهائي الشامل';
      case 'rules': return 'دليل الأحكام السريع';
      case 'books': return 'المراجع والمصادر';
      default: return 'المحتوى الدراسي';
    }
  };

  const isHome = activeTab === 'home';

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 text-slate-100 shadow-xs sticky top-0 z-30 no-print transition-colors duration-200 backdrop-blur-md">
      {/* Subtle top hairline */}
      <div className="h-0.5 w-full bg-emerald-600/30" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Right (RTL start): Sidebar Toggle & Course Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Collapsible Sidebar Toggle Button */}
            {!isHome && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold font-tajawal transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  isSidebarOpen 
                    ? 'bg-slate-800 text-amber-300 border-slate-700' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
                title={isSidebarOpen ? 'إخفاء الفهرس الجانبي' : 'فتح فهرس الحقيبة والدروس'}
                aria-label="تبديل القائمة الجانبية"
              >
                {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-emerald-400" />}
                <span className="hidden md:inline">الفهرس والدروس</span>
              </button>
            )}

            {/* Platform Brand: شعار وهُوية منصة مدارج */}
            <button
              onClick={onReturnToHome}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 py-1 rounded-2xl hover:bg-slate-900/90 transition-all cursor-pointer group text-right border border-slate-800/80 hover:border-amber-400/40 bg-slate-950/60 shadow-xs"
              title="منصة مدارج - العودة للرئيسية وتصفح الحقائب"
            >
              {/* Logo / Sacred Calligraphy Emblem */}
              <div className="relative shrink-0 flex items-center justify-center">
                {homeConfig.platformLogoUrl && homeConfig.platformLogoUrl.trim() ? (
                  <img
                    src={homeConfig.platformLogoUrl.trim()}
                    alt={homeConfig.platformName || 'شعار منصة مدارج'}
                    className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl p-0.5 drop-shadow-md border border-amber-400/60 bg-slate-900 ring-1 ring-amber-400/20"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-emerald-800 to-slate-950 flex items-center justify-center text-white shadow-md border border-amber-400/50 group-hover:scale-105 group-hover:border-amber-300 transition-all relative overflow-hidden">
                    <span className="font-quran font-black text-amber-200 text-sm drop-shadow-sm select-none">
                      مـ
                    </span>
                    <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-0.5 -right-0.5 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Platform Title */}
              <div className="flex flex-col justify-center leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black font-quran bg-gradient-to-l from-amber-200 via-amber-300 to-emerald-300 bg-clip-text text-transparent group-hover:from-amber-100 group-hover:to-white transition-colors tracking-wide">
                    {homeConfig.platformName || 'مدارج'}
                  </span>
                  <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-md font-quran font-bold hidden sm:inline shadow-2xs">
                    علوم التجويد
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-tajawal hidden md:block">
                  المنصة التعليمية المتكاملة
                </span>
              </div>
            </button>

            <span className="hidden sm:inline text-slate-700" aria-hidden="true">|</span>

            {/* Course Title & Switcher */}
            <div className="flex items-center gap-1.5">
              <div className="relative" ref={courseDropdownRef}>
                <button
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className="text-right hover:bg-slate-900 p-1 sm:px-2 py-1 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="التبديل بين الحقائب"
                >
                  <div className="max-w-[130px] sm:max-w-[200px] md:max-w-xs truncate">
                    <span className="text-xs sm:text-sm font-bold font-quran text-slate-100 truncate block">
                      {isHome ? 'كافة الحقائب والمناهج' : (activeCourse.shortTitle || activeCourse.title)}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                </button>

                {showCourseDropdown && (
                  <div className="absolute top-full right-0 mt-1.5 w-64 sm:w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-right space-y-0.5 animate-fadeIn">
                    <div className="text-[11px] font-bold text-slate-400 px-2 py-1 border-b border-slate-800">
                      الحقائب التجويدية المقررة
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
                      {getAllCourses().map((c) => {
                        const unlocked = isCourseUnlocked(c.id, isTeacherMode, c);
                        const isSelected = c.id === activeCourse.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              onSelectCourse(c.id);
                              setShowCourseDropdown(false);
                            }}
                            className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400/10 text-amber-300 font-bold'
                                : !unlocked && !isTeacherMode
                                ? 'text-rose-300/80 hover:bg-slate-800/60'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              {!unlocked && !isTeacherMode && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
                              <span className="truncate">{c.shortTitle || c.title}</span>
                              {!unlocked && !isTeacherMode && (
                                <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.2 rounded border border-rose-800/60">
                                  مقفلة
                                </span>
                              )}
                            </span>
                            {isSelected && <span className="text-[10px] text-amber-400">الحالية</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Center: Quiet Breadcrumb Section Title */}
          {!isHome && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-tajawal">
              <span className="text-slate-600">/</span>
              <span className="text-amber-300/90 font-medium">
                {currentSectionTitle || getTabLabel(activeTab)}
              </span>
            </div>
          )}

          {/* Left (RTL end): Progress, Night Mode & Tools */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Academic Progress */}
            <button
              onClick={onOpenProgressModal}
              className="text-slate-300 hover:text-white hover:bg-slate-900 px-2 sm:px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
              title="عرض سجل وإنجاز التقدم الدراسي"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-amber-300 font-bold">{progressPercentage}%</span>
            </button>

            {/* Quick Search */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="text-slate-400 hover:text-white hover:bg-slate-900 p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer"
                title="البحث الفوري في المحتوى (Ctrl+K)"
                aria-label="بحث"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Night / Light Mode Toggle */}
            <button
              onClick={() => setIsNightMode(!isNightMode)}
              className="text-slate-400 hover:text-white hover:bg-slate-900 p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer"
              title={isNightMode ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
              aria-label="تبديل الإضاءة"
            >
              {isNightMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Teacher Fast Badge */}
            {isTeacherMode && (
              <button
                onClick={onOpenTeacherDashboard}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer hidden sm:flex"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>لوحة المعلم</span>
              </button>
            )}

            {/* Unified Settings / Tools Menu */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                  showToolsDropdown ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="الأدوات والإعدادات"
                aria-label="قائمة الأدوات والإعدادات"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showToolsDropdown && (
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-right space-y-1 animate-fadeIn">
                  
                  {onOpenSearch && (
                    <button
                      onClick={() => {
                        setShowToolsDropdown(false);
                        onOpenSearch();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-amber-400" />
                        <span>البحث في المحتوى والشواهد</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Ctrl+K</span>
                    </button>
                  )}

                  {onOpenFontModal && (
                    <button
                      onClick={() => {
                        setShowToolsDropdown(false);
                        onOpenFontModal();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Type className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تخصيص خط المصحف الشريف</span>
                    </button>
                  )}

                  {onOpenShareModal && (
                    <button
                      onClick={() => {
                        setShowToolsDropdown(false);
                        onOpenShareModal();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>مشاركة إنجازك الدراسي</span>
                    </button>
                  )}

                  <div className="px-3 py-1 border-t border-slate-800/80">
                    <WhatsAppSupport variant="link" />
                  </div>

                  {isTeacherMode ? (
                    <>
                      <button
                        onClick={() => {
                          setShowToolsDropdown(false);
                          onOpenTeacherDashboard();
                        }}
                        className="w-full text-right px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-800"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>🎨 هوية وشعار منصة مدارج (رفع اللوجو)</span>
                      </button>

                      {onOpenBagManagement && (
                        <button
                          onClick={() => {
                            setShowToolsDropdown(false);
                            onOpenBagManagement();
                          }}
                          className="w-full text-right px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-800"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                          <span>إدارة الحقائب والدروس والأسعار</span>
                        </button>
                      )}

                      {onOpenCertificateEditor && (
                        <button
                          onClick={() => {
                            setShowToolsDropdown(false);
                            onOpenCertificateEditor();
                          }}
                          className="w-full text-right px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>تعديل قالب الشهادات</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowToolsDropdown(false);
                          setIsTeacherMode(false);
                        }}
                        className="w-full text-right px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-800"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>التبديل لواجهة الطالب</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowToolsDropdown(false);
                        onUnlockTeacherModal();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs text-amber-300/90 hover:text-amber-200 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-800"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>الدخول كمعلم أو مدرب</span>
                    </button>
                  )}

                  {studentName && onLogoutStudent && !isTeacherMode && (
                    <button
                      onClick={() => {
                        setShowToolsDropdown(false);
                        onLogoutStudent();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-800"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تسجيل الخروج ({studentName})</span>
                    </button>
                  )}

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
