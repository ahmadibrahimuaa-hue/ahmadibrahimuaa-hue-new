import React from 'react';
import { SCHOLARLY_BOOKS } from '../data/theoryData';
import { Book, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Course } from '../types';

interface BooksViewProps {
  course?: Course;
}

export const BooksView: React.FC<BooksViewProps> = ({ course }) => {
  const booksList = (course && course.books && course.books.length > 0)
    ? course.books
    : SCHOLARLY_BOOKS;

  const topicName = course?.shortTitle || course?.title || 'التقاء الساكنين';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-quran text-slate-800">
              المراجع والمصادر العلمية المعتمدة في {topicName}
            </h2>
            <p className="text-xs text-slate-500">
              أمهات كتب علم التجويد والقراءات المقررة في كليات القرآن الكريم والمعاهد الأزهرية
            </p>
          </div>
        </div>
      </div>

      {/* Books Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {booksList.map((book, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-emerald-300 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                  مصدر أصيل معتمد
                </span>
                <h3 className="text-lg font-bold font-quran text-slate-900 mt-1">
                  {book.title}
                </h3>
                <div className="text-xs font-bold text-emerald-800 mt-0.5">
                  تأليف: {book.author}
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-900 text-amber-300 font-bold text-sm flex items-center justify-center shrink-0">
                0{idx + 1}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-tajawal leading-relaxed">
              {book.description}
            </p>

            <div className="bg-emerald-50 border-r-4 border-emerald-600 p-3 rounded-l-xl text-xs space-y-0.5">
              <div className="font-bold text-emerald-950 font-quran">موقعه وأهميته في {topicName}:</div>
              <p className="text-emerald-800 font-tajawal">{book.importance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
