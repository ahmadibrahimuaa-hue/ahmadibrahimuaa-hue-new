import React, { useState } from 'react';
import { REVIEW_QUESTIONS, MULTIPLE_CHOICE_QUESTIONS, EXTRACTION_EXERCISES } from '../data/quizData';
import { HelpCircle, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Award, Sparkles, BookOpen } from 'lucide-react';
import { saveSubmission } from '../utils/studentStorage';

export const QuizView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'mcq' | 'exercises'>('review');

  // Review Q&A state
  const [openAnswerIds, setOpenAnswerIds] = useState<number[]>([]);
  
  // MCQ state
  const [mcqAnswers, setMcqAnswers] = useState<{ [key: number]: number }>({});
  const [mcqSubmitted, setMcqSubmitted] = useState<boolean>(false);

  // Extraction Exercises state
  const [exerciseAnswers, setExerciseAnswers] = useState<{ [key: number]: string }>({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState<{ [key: number]: boolean }>({});

  const toggleAnswer = (id: number) => {
    setOpenAnswerIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const showAllAnswers = () => {
    setOpenAnswerIds(REVIEW_QUESTIONS.map(q => q.id));
  };

  const hideAllAnswers = () => {
    setOpenAnswerIds([]);
  };

  // MCQ handlers
  const handleMcqSelect = (questionId: number, optionIndex: number) => {
    if (mcqSubmitted) return;
    setMcqAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateMcqScore = () => {
    let score = 0;
    MULTIPLE_CHOICE_QUESTIONS.forEach(q => {
      if (mcqAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const resetMcq = () => {
    setMcqAnswers({});
    setMcqSubmitted(false);
  };

  // Exercise handlers
  const handleExerciseSelect = (exId: number, method: string) => {
    setExerciseAnswers(prev => ({ ...prev, [exId]: method }));
  };

  const checkExercise = (exId: number) => {
    setExerciseSubmitted(prev => ({ ...prev, [exId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('review')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'review'
                ? 'bg-emerald-900 text-amber-300 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            15 أسئلة مراجعة نموذجية
          </button>
          <button
            onClick={() => setActiveSubTab('mcq')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'mcq'
                ? 'bg-emerald-900 text-amber-300 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            10 أسئلة اختيار من متعدد
          </button>
          <button
            onClick={() => setActiveSubTab('exercises')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'exercises'
                ? 'bg-emerald-900 text-amber-300 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            10 تدريبات عملية استخراجية
          </button>
        </div>
      </div>

      {/* 1. REVIEW QUESTIONS MODE */}
      {activeSubTab === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-900 text-xs sm:text-sm font-bold">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>15 أسئلة مراجعة وتحصيل علمي مجابة موثقة بالكتب المصدرية</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={showAllAnswers}
                className="text-xs bg-emerald-900 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-800 transition-all cursor-pointer"
              >
                إظهار جميع الإجابات
              </button>
              <button
                onClick={hideAllAnswers}
                className="text-xs bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg hover:bg-slate-300 transition-all cursor-pointer"
              >
                إخفاء الكل
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {REVIEW_QUESTIONS.map((q) => {
              const isOpen = openAnswerIds.includes(q.id);
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div
                    onClick={() => toggleAnswer(q.id)}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {q.id}
                      </span>
                      <div>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                          {q.category}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-quran mt-1 leading-snug">
                          {q.question}
                        </h3>
                      </div>
                    </div>

                    <button className="text-xs text-emerald-700 font-bold flex items-center gap-1 shrink-0 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{isOpen ? 'إخفاء الإجابة' : 'عرض الإجابة'}</span>
                    </button>
                  </div>

                  {isOpen && (
                    <div className="p-5 bg-amber-50/40 border-t border-slate-200 space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed font-tajawal">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>الإجابة النموذجية:</span>
                      </div>
                      <p className="pr-5 text-slate-700 whitespace-pre-line leading-relaxed">
                        {q.answer}
                      </p>
                      {q.sourceBook && (
                        <div className="text-[11px] text-slate-400 italic pt-2 border-t border-amber-200/60">
                          المصدر المعتمد: {q.sourceBook}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MULTIPLE CHOICE TEST MODE */}
      {activeSubTab === 'mcq' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-quran text-slate-900">
                  اختبار تقييم المستوى التفاعلي (10 أسئلة اختيار من متعدد)
                </h3>
                <p className="text-xs text-slate-500">
                  اختر الإجابة الصحيحة ثم اضغط على زر اعتماد النتيجة واحتساب الدرجة
                </p>
              </div>

              {mcqSubmitted ? (
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-900 text-amber-300 px-4 py-2 rounded-xl text-center font-bold">
                    <span className="text-xs block text-emerald-200">النتيجة النهائية:</span>
                    <span className="text-lg font-extrabold">{calculateMcqScore()} / 10</span>
                  </div>
                  <button
                    onClick={resetMcq}
                    className="flex items-center gap-1.5 bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>إعادة الاختبار</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setMcqSubmitted(true);
                    const score = calculateMcqScore();
                    await saveSubmission('اختبار تقييم المستوى', 'اختبار 10 أسئلة اختيار من متعدد', score, MULTIPLE_CHOICE_QUESTIONS.length);
                  }}
                  disabled={Object.keys(mcqAnswers).length === 0}
                  className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-amber-300 font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer shadow-md"
                >
                  اعتماد وحساب النتيجة
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {MULTIPLE_CHOICE_QUESTIONS.map((q, qIndex) => {
              const selectedOpt = mcqAnswers[q.id];
              const isSelected = selectedOpt !== undefined;

              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {qIndex + 1}
                    </span>
                    <div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                        {q.category}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold font-quran text-slate-900 mt-1">
                        {q.question}
                      </h4>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIndex) => {
                      const isChosen = selectedOpt === optIndex;
                      const isCorrect = optIndex === q.correctIndex;

                      let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";

                      if (mcqSubmitted) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-100 border-emerald-500 text-emerald-950 font-bold shadow-sm";
                        } else if (isChosen && !isCorrect) {
                          btnStyle = "bg-rose-100 border-rose-500 text-rose-950 font-bold";
                        }
                      } else if (isChosen) {
                        btnStyle = "bg-emerald-900 text-amber-300 border-emerald-800 font-bold shadow-sm";
                      }

                      return (
                        <button
                          key={optIndex}
                          onClick={() => handleMcqSelect(q.id, optIndex)}
                          disabled={mcqSubmitted}
                          className={`w-full text-right p-3 rounded-xl border text-xs sm:text-sm font-tajawal transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {mcqSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {mcqSubmitted && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Rationale Explanation on Submit */}
                  {mcqSubmitted && (
                    <div className="bg-amber-50 border-r-4 border-amber-500 p-3.5 rounded-l-xl text-xs text-slate-700 space-y-1">
                      <div className="font-bold text-amber-900 font-quran">الشرح والعلة العلمية:</div>
                      <p className="font-tajawal leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PRACTICAL EXTRACTION EXERCISES MODE */}
      {activeSubTab === 'exercises' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold font-quran text-slate-900">
              10 تدريبات عملية استخراجية لتحليل التقاء الساكنين في الآيات
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              اقرأ الآية بتمعن واكتشف موضع التقاء الساكنين ثم حدد طريقة التخلص المناسبة واضغط للتحقق
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {EXTRACTION_EXERCISES.map((ex, idx) => {
              const userChoice = exerciseAnswers[ex.id];
              const isChecked = exerciseSubmitted[ex.id];
              const isRight = userChoice === ex.correctMethod;

              return (
                <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  {/* Ayah Display */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-center space-y-1">
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                      سورة {ex.surahInfo}
                    </span>
                    <p className="font-quran text-lg sm:text-xl text-slate-900 leading-loose">
                      ﴿ {ex.ayahText} ﴾
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-500 block">الموضع المستهدف:</span>
                      <span className="font-quran font-bold text-slate-900 text-sm">{ex.targetPhrase}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-500 block">الساكنان المتلاقيان:</span>
                      <span className="font-tajawal text-slate-800">{ex.firstSukoon} + {ex.secondSukoon}</span>
                    </div>
                  </div>

                  {/* Method Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      اختر طريقة التخلص الصحيحة من بين الخيارات التالية:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ex.optionsForMethod.map((method, mIdx) => {
                        const isSelected = userChoice === method;
                        return (
                          <button
                            key={mIdx}
                            onClick={() => handleExerciseSelect(ex.id, method)}
                            disabled={isChecked}
                            className={`p-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-900 text-amber-300 border-emerald-800 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Check Button */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => checkExercise(ex.id)}
                      disabled={!userChoice || isChecked}
                      className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-amber-300 font-bold text-xs py-2 px-4 rounded-xl shadow-sm cursor-pointer"
                    >
                      {isChecked ? 'تم التحقق' : 'تحقق من صحة اختيارك'}
                    </button>

                    {isChecked && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isRight ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                      }`}>
                        {isRight ? 'إجابة صائبة ممتازة!' : 'إجابة غير دقيقة، راجع الشرح'}
                      </span>
                    )}
                  </div>

                  {/* Feedback Explanation */}
                  {isChecked && (
                    <div className="bg-emerald-50 border-r-4 border-emerald-600 p-3.5 rounded-l-xl text-xs text-slate-800 space-y-1 font-tajawal leading-relaxed">
                      <span className="font-bold text-emerald-900 font-quran">التحليل الصحيح للموضع:</span>
                      <p>{ex.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
