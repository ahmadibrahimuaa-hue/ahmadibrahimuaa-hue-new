import React from 'react';
import { DiagramTree } from '../types';
import { GitBranch, Sparkles, CheckCircle, ArrowDown } from 'lucide-react';

interface DiagramTreeRendererProps {
  tree: DiagramTree;
  lessonTitle: string;
}

export const DiagramTreeRenderer: React.FC<DiagramTreeRendererProps> = ({ tree, lessonTitle }) => {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-300',
          badge: 'bg-emerald-800 text-emerald-100',
          title: 'text-emerald-950',
          bullet: 'text-emerald-600',
          accent: 'from-emerald-600 to-teal-700'
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-300',
          badge: 'bg-amber-800 text-amber-100',
          title: 'text-amber-950',
          bullet: 'text-amber-600',
          accent: 'from-amber-600 to-orange-700'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10 hover:bg-purple-500/15 border-purple-300',
          badge: 'bg-purple-800 text-purple-100',
          title: 'text-purple-950',
          bullet: 'text-purple-600',
          accent: 'from-purple-600 to-indigo-700'
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/10 hover:bg-blue-500/15 border-blue-300',
          badge: 'bg-blue-800 text-blue-100',
          title: 'text-blue-950',
          bullet: 'text-blue-600',
          accent: 'from-blue-600 to-cyan-700'
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-300',
          badge: 'bg-rose-800 text-rose-100',
          title: 'text-rose-950',
          bullet: 'text-rose-600',
          accent: 'from-rose-600 to-pink-700'
        };
      default:
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-300',
          badge: 'bg-emerald-800 text-emerald-100',
          title: 'text-emerald-950',
          bullet: 'text-emerald-600',
          accent: 'from-emerald-600 to-teal-700'
        };
    }
  };

  return (
    <div className="my-8 space-y-6">
      {/* Visual Section Divider Header */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-emerald-300"></div>
        </div>
        <div className="relative bg-emerald-900 text-amber-300 px-6 py-2 rounded-full font-quran text-sm font-bold flex items-center gap-2 shadow-md border border-amber-400">
          <GitBranch className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>التشجير التوضيحي المباشر للشرح النظرى (ملخص الخريطة المفاهيمية)</span>
        </div>
      </div>

      {/* Main Diagram Canvas Card */}
      <div className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-amber-400/40 shadow-xl text-white space-y-6">
        {/* Tree Root Head */}
        <div className="text-center space-y-2 pb-4 border-b border-emerald-800/80">
          <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-4 py-1 rounded-full text-xs font-bold font-quran shadow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خلاصة مفاهيم {lessonTitle}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-quran text-amber-200">
            {tree.mainTitle}
          </h3>
          {tree.subTitle && (
            <p className="text-xs sm:text-sm text-emerald-200/80 font-tajawal max-w-2xl mx-auto">
              {tree.subTitle}
            </p>
          )}
        </div>

        {/* Tree Branch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tree.branches.map((branch, index) => {
            const styles = getColorClasses(branch.color);
            return (
              <div
                key={index}
                className={`bg-white rounded-xl p-5 border-2 shadow-md transition-all duration-200 hover:-translate-y-1 space-y-3 relative ${styles.bg}`}
              >
                {/* Branch Number & Badge */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-quran shadow-sm ${styles.badge}`}>
                    {branch.badge || `الفرع 0${index + 1}`}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-quran">
                    #{index + 1}
                  </span>
                </div>

                {/* Branch Title */}
                <h4 className={`font-bold font-quran text-base ${styles.title}`}>
                  {branch.title}
                </h4>

                {/* Branch Bullet Details */}
                <ul className="space-y-2 text-xs font-tajawal text-slate-700">
                  {branch.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${styles.bullet}`} />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Transition Arrow to Examples Analysis */}
        <div className="pt-2 text-center flex flex-col items-center gap-1 text-emerald-300 font-tajawal text-xs">
          <div className="flex items-center gap-2 bg-emerald-900/80 border border-emerald-700/80 text-amber-300 px-4 py-1.5 rounded-xl">
            <span>الانتقال من التشجير إلى التحليل القرآني والتطبيق الشفهي</span>
            <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};
