import React from 'react';
import { CertificateConfig, getCourseCertSettings } from '../utils/certificateConfigStorage';

interface Props {
  studentName: string;
  percentage: number;
  config: CertificateConfig;
  className?: string;
  onPrint?: () => void;
  courseId?: string;
  unitTitle?: string;
  certTypeLabel?: string;
}

export const CertificateTemplateView: React.FC<Props> = ({
  studentName,
  percentage,
  config,
  className = '',
  onPrint,
  courseId = 'sakinan',
  unitTitle,
  certTypeLabel,
}) => {
  const courseSettings = getCourseCertSettings(config, courseId);

  const bgUrl = courseSettings.bgTemplateUrl || '/certificate_template.jpg';
  const studentTop = courseSettings.studentNameTopPct ?? 33.8;
  const studentRight = courseSettings.studentNameRightPct ?? 26;
  const studentWidth = config.studentNameWidthPct ?? 48;
  const studentScale = (courseSettings.studentNameScalePct ?? 100) / 100;
  const studentColor = courseSettings.studentNameColor || '#0f172a';

  const scoreTop = courseSettings.scoreTopPct ?? 56.8;
  const scoreRight = courseSettings.scoreRightPct ?? 38.0;
  const scoreWidth = config.scoreWidthPct ?? 20;
  const scoreScale = (courseSettings.scoreScalePct ?? 100) / 100;
  const scoreColor = courseSettings.scoreColor || '#0f172a';

  const displaySubtitle = certTypeLabel || unitTitle || courseSettings.customText1 || '';

  const getGradeTitle = (pct: number) => {
    if (pct >= 95) return 'ممتاز';
    if (pct >= 89) return 'جيد جداً';
    if (pct >= 70) return 'جيد';
    if (pct >= 60) return 'مقبول';
    return '';
  };

  const isQualified = percentage >= 98 && percentage <= 100;
  const gradeTitle = getGradeTitle(percentage);

  return (
    <div className={`relative w-full max-w-4xl mx-auto ${className}`}>
      {/* Certificate Print Frame */}
      <div
        className="certificate-frame relative overflow-hidden bg-white shadow-2xl mx-auto border-2 border-amber-300 rounded-2xl transition-all"
        style={{
          width: '100%',
          aspectRatio: '297 / 210',
          containerType: 'inline-size',
        }}
      >
        {/* Template Image */}
        <img
          src={bgUrl}
          alt="شهادة اجتياز"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />

        {/* Dynamic Overlay 1: Student Name */}
        <div
          className="absolute flex items-center justify-center font-bold text-center pointer-events-none transition-all"
          style={{
            top: `${studentTop}%`,
            right: `${studentRight}%`,
            width: `${studentWidth}%`,
            transform: `scale(${studentScale})`,
            transformOrigin: 'center center',
            color: studentColor,
            fontFamily: "'Amiri', 'Tajawal', serif",
            fontSize: 'clamp(14px, 3.8cqw, 48px)',
            lineHeight: '1.2',
            textShadow: '0 0 1px rgba(0,0,0,0.1)',
          }}
        >
          <span className="truncate px-2 font-extrabold tracking-wide">{studentName.trim() || 'اسم الطالب/ة'}</span>
        </div>

        {/* Dynamic Overlay: Unit / Course Badge if specified */}
        {displaySubtitle && (
          <div
            className="absolute flex items-center justify-center font-bold text-center pointer-events-none transition-all"
            style={{
              top: '46.2%',
              right: `${studentRight}%`,
              width: `${studentWidth}%`,
              color: courseSettings.customText1Color || '#065f46',
              fontFamily: "'Tajawal', 'Amiri', serif",
              fontSize: 'clamp(9px, 2cqw, 22px)',
            }}
          >
            <span className="bg-amber-50/90 text-emerald-950 px-3 py-0.5 rounded-full border border-amber-300 shadow-xs font-quran font-bold">
              {displaySubtitle}
            </span>
          </div>
        )}

        {/* Dynamic Overlay 2: Percentage Score + Rating + Teaching Qualification (98% - 100%) */}
        <div
          className="absolute flex items-center justify-center font-bold text-center pointer-events-none transition-all"
          style={{
            top: `${scoreTop}%`,
            right: `${scoreRight}%`,
            width: 'auto',
            minWidth: `${scoreWidth}%`,
            transform: `scale(${scoreScale})`,
            transformOrigin: 'center center',
            color: scoreColor,
            fontFamily: "'Tajawal', 'Amiri', 'Cairo', sans-serif",
            fontSize: isQualified ? 'clamp(11px, 2.7cqw, 36px)' : 'clamp(12px, 3.2cqw, 42px)',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="flex items-center gap-4 flex-nowrap">
            <span dir="ltr" className="font-black font-sans tracking-tight">
              %{percentage}
            </span>
            {percentage >= 90 && gradeTitle && (
              <div className="flex items-center gap-3 font-quran mr-3">
                <span className="opacity-60 text-[0.8em] font-sans">|</span>
                <span className="font-bold">
                  التقدير: {gradeTitle}
                </span>
                {isQualified && (
                  <span className="font-extrabold text-emerald-950 bg-amber-300/40 px-4 py-0.5 rounded-full border border-amber-400/70 shadow-xs mr-8 sm:mr-12">
                    (مؤهل لتدريس المحتوى)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Button (Screen Only) */}
      {onPrint && (
        <div className="mt-4 flex items-center justify-center no-print">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-emerald-950 font-extrabold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg cursor-pointer border border-amber-300 font-quran"
          >
            <svg className="w-5 h-5 text-emerald-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>طباعة الشهادة الرسمية وتصديرها</span>
          </button>
        </div>
      )}
    </div>
  );
};
