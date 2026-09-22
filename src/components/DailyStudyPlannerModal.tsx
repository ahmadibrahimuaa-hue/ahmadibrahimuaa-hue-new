import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Bell, BellOff, Flame, CheckCircle2, 
  Circle, Plus, Trash2, Trophy, Sparkles, BookOpen, 
  Layers, Award, Check, AlertCircle, Target
} from 'lucide-react';
import { 
  DailyPlannerData, DailyTask, getDailyPlannerData, 
  saveDailyPlannerData, togglePlannerTask, addCustomPlannerTask, 
  deletePlannerTask, subscribeDailyPlanner 
} from '../utils/dailyPlannerStorage';

interface DailyStudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabId: string, unitIndex?: number) => void;
}

export const DailyStudyPlannerModal: React.FC<DailyStudyPlannerModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [planner, setPlanner] = useState<DailyPlannerData>(() => getDailyPlannerData());
  const [newTaskInput, setNewTaskInput] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [testSentToast, setTestSentToast] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  useEffect(() => {
    const refresh = () => {
      setPlanner(getDailyPlannerData());
    };
    refresh();
    const unsub = subscribeDailyPlanner(refresh);
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const completedTasksCount = planner.tasks.filter((t) => t.isCompleted).length;
  const totalTasksCount = planner.tasks.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const handleToggleTask = (taskId: string) => {
    const updated = togglePlannerTask(taskId);
    setPlanner({ ...updated });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const updated = addCustomPlannerTask(newTaskInput);
    setPlanner({ ...updated });
    setNewTaskInput('');
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = deletePlannerTask(taskId);
    setPlanner({ ...updated });
  };

  const handleSelectGoal = (
    goal: DailyPlannerData['dailyGoal'],
    label: string,
    targetMin: number
  ) => {
    const updated = saveDailyPlannerData({
      dailyGoal: goal,
      dailyGoalLabel: label,
      targetMinutes: targetMin,
    });
    setPlanner({ ...updated });
  };

  const handleToggleReminder = async () => {
    if (!planner.reminderEnabled) {
      // Enabling reminder -> request notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await Notification.requestPermission();
          setNotificationPermission(perm);
          if (perm === 'granted') {
            const updated = saveDailyPlannerData({ reminderEnabled: true });
            setPlanner({ ...updated });
          } else {
            // If denied, still allow in-app reminders
            const updated = saveDailyPlannerData({ reminderEnabled: true });
            setPlanner({ ...updated });
          }
        } catch {
          const updated = saveDailyPlannerData({ reminderEnabled: true });
          setPlanner({ ...updated });
        }
      } else {
        const updated = saveDailyPlannerData({ reminderEnabled: true });
        setPlanner({ ...updated });
      }
    } else {
      const updated = saveDailyPlannerData({ reminderEnabled: false });
      setPlanner({ ...updated });
    }
  };

  const handleTimeChange = (timeStr: string) => {
    const updated = saveDailyPlannerData({ reminderTime: timeStr });
    setPlanner({ ...updated });
  };

  const handleSendTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 إشعار تجريبي: منصة الحقائب التجويدية', {
          body: `حان موعد جلستك القرآنية اليومية (${planner.dailyGoalLabel})! واصل سلسلة إنجازك المتواصلة.`,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error('Test notification error:', e);
      }
    }
    setTestSentToast(true);
    setTimeout(() => setTestSentToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-tajawal dir-rtl no-print">
      <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 border-b border-emerald-800/80 relative flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl text-slate-950 shadow-lg border border-amber-300">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-300 font-bold font-quran bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  تنظيم ومتابعة المذاكرة
                </span>
                <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-bold font-sans px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
                  <span>{planner.streakCount} أيام متتالية</span>
                </div>
              </div>
              <h2 className="text-xl font-black font-quran text-amber-100 mt-1">
                مخطط الدراسة اليومي والتذكير الذكي
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-emerald-900/60 rounded-full transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {testSentToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold font-quran px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-150">
            <Check className="w-4 h-4" />
            <span>تم إرسال إشعار التذكير التجريبي بنجاح!</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* Goal Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-amber-300 font-quran flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              <span>حدد هدفك الدراسي اليومي:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'finish_unit',
                  title: 'إنهاء باب دراسي كامل 📖',
                  desc: 'دراسة باب بجميع محاوره وأمثلته والتحقق من فهم الأدلة',
                  time: 25,
                },
                {
                  id: 'review_examples',
                  title: 'مراجعة الأمثلة والمختبر الصوتي 🎙️',
                  desc: 'الاستماع لـ 5 أمثلة قرآنية وتطبيق النطق الصحيح',
                  time: 15,
                },
                {
                  id: 'study_exceptions',
                  title: 'مراجعة الكلمات المستثناة ⚠️',
                  desc: 'حفظ وضبط استثناءات رواية حفص وأسبابها',
                  time: 15,
                },
                {
                  id: 'pass_exam',
                  title: 'خوض التحدي الشامل ⚡',
                  desc: 'إتمام الاختبار الشامل في أقل من دقيقتين ونصف',
                  time: 20,
                },
              ].map((g) => {
                const isSelected = planner.dailyGoal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelectGoal(g.id as any, g.title, g.time)}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold font-quran ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                        {g.title}
                      </span>
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-amber-400 font-sans font-bold">
                        {g.time} دقيقة
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-tajawal mt-1 leading-relaxed">
                      {g.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Tasks Progress Bar */}
          <div className="bg-slate-950/80 border border-emerald-800/60 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold font-quran">
              <span className="text-emerald-200">
                إنجاز مهام اليوم ({completedTasksCount} من {totalTasksCount} مكتملة):
              </span>
              <span className="text-amber-400 font-sans text-sm">{completionPercentage}%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Daily Tasks Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-200 font-quran flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>قائمة مهام المذاكرة لليوم:</span>
              </label>
              <span className="text-[11px] text-slate-400">انقر لتحديد المهمة كمكتملة</span>
            </div>

            <div className="space-y-2">
              {planner.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    task.isCompleted
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-center gap-3 text-right flex-1 cursor-pointer"
                  >
                    <div className="shrink-0">
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <span className={`text-xs font-tajawal ${task.isCompleted ? 'line-through opacity-70 text-slate-400' : 'text-slate-200 font-bold'}`}>
                      {task.title}
                    </span>
                  </button>

                  {task.category === 'custom' && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Task Form */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="أضف مهمة تجويدية إضافية خاصة بك..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 font-tajawal focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold font-quran px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-slate-700 shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </form>
          </div>

          {/* Reminder & Notification Scheduler */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4.5 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${planner.reminderEnabled ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                  {planner.reminderEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold font-quran text-amber-200">
                    منبه التذكير اليومي بالمذاكرة
                  </h3>
                  <p className="text-[11px] text-slate-400 font-tajawal">
                    تنبيهك عبر إشعار المتصفح أو الرسالة التنبيهية عند حلول وقت الجلسة
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleReminder}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  planner.reminderEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    planner.reminderEnabled ? '-translate-x-6' : '-translate-x-1'
                  }`}
                />
              </button>
            </div>

            {planner.reminderEnabled && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-quran">موعد التذكير اليومي:</span>
                  <input
                    type="time"
                    value={planner.reminderTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-xs text-amber-300 font-sans font-bold focus:border-amber-400 focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  className="w-full sm:w-auto text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-quran transition-colors cursor-pointer border border-slate-700"
                >
                  تجربة إرسال إشعار فوري 🔔
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>المواظبة اليومية تبني ملكة الإتقان التجويدي</span>
          </div>

          <button
            onClick={onClose}
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold font-quran px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
