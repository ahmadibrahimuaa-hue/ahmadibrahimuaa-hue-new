import React, { useState } from 'react';
import { SUMMARY_TABLE_DATA } from '../data/summaryData';
import { Table, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { Course } from '../types';

interface SummaryTableViewProps {
  course?: Course;
}

export const SummaryTableView: React.FC<SummaryTableViewProps> = ({ course }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tableData = (course && course.summaryTable && course.summaryTable.length > 0)
    ? course.summaryTable
    : SUMMARY_TABLE_DATA;

  const topicName = course?.shortTitle || course?.title || 'التقاء الساكنين';

  const filteredData = tableData.filter((row) =>
    (row.type || '').includes(searchQuery) ||
    (row.disposalMethod || '').includes(searchQuery) ||
    (row.exampleText || '').includes(searchQuery) ||
    (row.tajweedRule || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Table Header Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <Table className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-quran text-slate-800">
              جدول التلخيص الشامل لأحكام {topicName}
            </h2>
            <p className="text-xs text-slate-500">
              مقارنة جامعة محددة للأنواع، الأسباب، الأداء والضوابط، الأمثلة، والأحكام التجويدية
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="تصفية وفلترة في الجدول..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-emerald-950 text-amber-300 font-quran text-xs sm:text-sm border-b border-emerald-900">
                <th className="p-4 border-l border-emerald-900">#</th>
                <th className="p-4 border-l border-emerald-900 min-w-[180px]">نوع الالتقاء والصورة</th>
                <th className="p-4 border-l border-emerald-900 min-w-[220px]">الشرط والسبب الصوتي</th>
                <th className="p-4 border-l border-emerald-900 min-w-[160px]">طريقة التخلص المقررة</th>
                <th className="p-4 border-l border-emerald-900 min-w-[200px]">مثال قرآن وشاهد</th>
                <th className="p-4 min-w-[240px]">الحكم التجويدي والضابط الأداء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-700">
              {filteredData.map((row, index) => (
                <tr
                  key={row.id}
                  className={`hover:bg-amber-50/40 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <td className="p-4 font-bold text-center text-emerald-900 bg-slate-100/60 border-l border-slate-200">
                    {index + 1}
                  </td>
                  <td className="p-4 font-bold font-quran text-slate-900 border-l border-slate-200">
                    {row.type}
                  </td>
                  <td className="p-4 text-xs text-slate-600 border-l border-slate-200 leading-relaxed font-tajawal">
                    {row.condition}
                  </td>
                  <td className="p-4 border-l border-slate-200">
                    <span
                      className={`inline-block font-bold px-3 py-1 rounded-full text-xs border ${
                        row.disposalMethod.includes('كسر')
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : row.disposalMethod.includes('فتح')
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : row.disposalMethod.includes('ضم')
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : row.disposalMethod.includes('الحذف')
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {row.disposalMethod}
                    </span>
                  </td>
                  <td className="p-4 border-l border-slate-200">
                    <div className="font-quran text-base text-emerald-950 font-bold">
                      {row.exampleText}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {row.surahRef}
                    </div>
                  </td>
                  <td className="p-4 text-xs space-y-1">
                    <div className="font-bold text-emerald-900">{row.tajweedRule}</div>
                    <div className="text-[11px] text-slate-500 italic">{row.scholarlyNote}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
