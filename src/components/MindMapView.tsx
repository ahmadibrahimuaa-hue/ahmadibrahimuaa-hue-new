import React, { useState } from 'react';
import { MindMapNode } from '../types';
import { Sparkles, ChevronRight, ChevronDown, Layers, BookOpen } from 'lucide-react';

interface MindMapViewProps {
  data: MindMapNode;
  unitTitle: string;
}

export const MindMapView: React.FC<MindMapViewProps> = ({ data, unitTitle }) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    [data.id]: true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: MindMapNode, isRoot = false) => {
    const isExpanded = expandedNodes[node.id] !== false;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`
            p-4 rounded-2xl border transition-all cursor-pointer select-none text-center relative max-w-xs sm:max-w-sm w-full
            ${isRoot
              ? 'bg-emerald-900 text-amber-300 border-emerald-700 shadow-lg ring-4 ring-emerald-900/20'
              : 'bg-white text-slate-800 border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md'
            }
          `}
        >
          {node.badge && (
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1 ${
              isRoot ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {node.badge}
            </span>
          )}

          <div className="font-bold text-sm sm:text-base font-quran leading-snug flex items-center justify-center gap-2">
            <span>{node.label}</span>
            {hasChildren && (
              <span className="text-slate-400">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            )}
          </div>

          {node.subtitle && (
            <p className={`text-xs mt-1 font-tajawal ${isRoot ? 'text-emerald-200' : 'text-slate-500'}`}>
              {node.subtitle}
            </p>
          )}
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="relative mt-6 pt-6 border-t-2 border-emerald-300 flex flex-wrap justify-center gap-4 sm:gap-6 w-full">
            {node.children!.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/30 rounded-2xl p-6 border border-emerald-200/80 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-2 text-emerald-900 font-bold font-quran text-base sm:text-lg">
          <Layers className="w-5 h-5 text-amber-600" />
          <span>الخريطة الذهنية التفاعلية: {unitTitle}</span>
        </div>
        <span className="text-xs text-slate-500 font-tajawal bg-white px-3 py-1 rounded-full border border-slate-200">
          انقر على العقد للتوسيع والطي
        </span>
      </div>

      <div className="overflow-x-auto py-4 flex justify-center min-w-[300px]">
        {renderNode(data, true)}
      </div>
    </div>
  );
};
