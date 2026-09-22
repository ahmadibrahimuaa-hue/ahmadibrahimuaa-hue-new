import React, { useState, useEffect, useRef } from 'react';
import { Award, Sparkles, X, Trophy, CheckCircle2, Share2, ChevronLeft } from 'lucide-react';
import { StudentBadge } from '../utils/badgeSystem';

interface BadgeEarnedToastProps {
  onOpenShareModal?: (badge?: StudentBadge) => void;
  onOpenProgressModal?: () => void;
}

export const BadgeEarnedToast: React.FC<BadgeEarnedToastProps> = ({
  onOpenShareModal,
  onOpenProgressModal,
}) => {
  const [currentBadge, setCurrentBadge] = useState<StudentBadge | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleBadgeUnlocked = (e: Event) => {
      const customEvent = e as CustomEvent<StudentBadge>;
      if (customEvent.detail) {
        setCurrentBadge(customEvent.detail);
        setIsVisible(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        // Auto hide after 9 seconds
        timerRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 9000);
      }
    };

    window.addEventListener('tajweed_badge_unlocked', handleBadgeUnlocked);
    return () => {
      window.removeEventListener('tajweed_badge_unlocked', handleBadgeUnlocked);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleShareClick = () => {
    if (onOpenShareModal) {
      onOpenShareModal(currentBadge || undefined);
    } else {
      window.dispatchEvent(
        new CustomEvent('tajweed_open_share_achievement', {
          detail: { badge: currentBadge },
        })
      );
    }
    setIsVisible(false);
  };

  const handleViewProgressClick = () => {
    if (onOpenProgressModal) {
      onOpenProgressModal();
    } else {
      window.dispatchEvent(new CustomEvent('tajweed_open_progress_modal'));
    }
    setIsVisible(false);
  };

  if (!isVisible || !currentBadge) return null;

  return (
    <div 
      className="fixed top-6 right-6 z-50 max-w-md w-full animate-bounce-short font-tajawal dir-rtl no-print"
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => setIsVisible(false), 5000);
      }}
    >
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-0.5 rounded-3xl shadow-2xl">
        <div className="bg-slate-950/95 backdrop-blur-md rounded-[22px] p-5 text-slate-100 border border-amber-400/40 relative overflow-hidden">
          
          {/* Sparkle background element */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
          
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute left-3 top-3 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            {/* Badge Icon Container with pulse animation */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-3xl font-bold shadow-lg border-2 border-amber-300 shrink-0 animate-pulse">
              {currentBadge.icon}
            </div>

            <div className="space-y-1 pr-1 flex-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold font-quran text-xs">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>🎉 مبارك! وسام إنجاز تجويدي جديد</span>
              </div>

              <h4 className="text-base font-black font-quran text-amber-100 leading-snug">
                {currentBadge.title}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {currentBadge.description}
              </p>

              {/* Action Buttons: Share & View Badges */}
              <div className="pt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleShareClick}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-quran px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة هذا الإنجاز</span>
                </button>

                <button
                  onClick={handleViewProgressClick}
                  className="bg-slate-800/90 hover:bg-slate-700 text-amber-200 border border-slate-700 text-xs font-bold font-quran px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>سجل الأوسمة</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-600/50 font-bold font-quran inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>تم توثيق الوسام في سجل تقدمك الدائم</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

