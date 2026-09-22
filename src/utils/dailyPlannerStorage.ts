export interface DailyTask {
  id: string;
  title: string;
  category: 'unit' | 'exam' | 'examples' | 'exceptions' | 'custom';
  isCompleted: boolean;
}

export interface DailyPlannerData {
  dailyGoal: 'finish_unit' | 'review_examples' | 'study_exceptions' | 'pass_exam' | 'custom';
  dailyGoalLabel: string;
  targetMinutes: number;
  streakCount: number;
  lastActiveDate: string;
  reminderEnabled: boolean;
  reminderTime: string; // e.g. "20:30"
  lastReminderSentDate?: string;
  tasks: DailyTask[];
}

const PLANNER_STORAGE_KEY = 'tajweed_daily_planner_v1';

const DEFAULT_PLANNER: DailyPlannerData = {
  dailyGoal: 'finish_unit',
  dailyGoalLabel: 'إنهاء باب تجويدي ومراجعة أسئلته',
  targetMinutes: 20,
  streakCount: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  reminderEnabled: false,
  reminderTime: '20:30',
  tasks: [
    { id: 'task_1', title: 'دراسة باب دراسي كامل مع الأدلة', category: 'unit', isCompleted: false },
    { id: 'task_2', title: 'الاستماع للمختبر الصوتي ومقارنة النطق', category: 'examples', isCompleted: false },
    { id: 'task_3', title: 'مراجعة الكلمات المستثناة لحفص', category: 'exceptions', isCompleted: false },
    { id: 'task_4', title: 'حل أسئلة التقويم والتحدي الشامل', category: 'exam', isCompleted: false },
  ],
};

type PlannerListener = (data: DailyPlannerData) => void;
const listeners: PlannerListener[] = [];

export const subscribeDailyPlanner = (callback: PlannerListener): (() => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyListeners = (data: DailyPlannerData) => {
  listeners.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Planner listener error:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tajweed_planner_updated', { detail: data }));
  }
};

export const getDailyPlannerData = (): DailyPlannerData => {
  if (typeof window === 'undefined') return DEFAULT_PLANNER;
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!raw) return DEFAULT_PLANNER;
    const parsed: DailyPlannerData = JSON.parse(raw);

    // Check streak date
    const today = new Date().toISOString().split('T')[0];
    const lastDate = parsed.lastActiveDate;
    
    if (lastDate !== today) {
      // Calculate day difference
      const last = new Date(lastDate);
      const curr = new Date(today);
      const diffTime = Math.abs(curr.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        // Keep streak
      } else if (diffDays > 1) {
        // Streak broken
        parsed.streakCount = 1;
      }
      // Reset daily task checks for the new day
      parsed.tasks = parsed.tasks.map(t => ({ ...t, isCompleted: false }));
      parsed.lastActiveDate = today;
      localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(parsed));
    }

    return { ...DEFAULT_PLANNER, ...parsed };
  } catch {
    return DEFAULT_PLANNER;
  }
};

export const saveDailyPlannerData = (updated: Partial<DailyPlannerData>): DailyPlannerData => {
  const current = getDailyPlannerData();
  const merged: DailyPlannerData = {
    ...current,
    ...updated,
    lastActiveDate: new Date().toISOString().split('T')[0],
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(merged));
  }

  notifyListeners(merged);
  return merged;
};

export const togglePlannerTask = (taskId: string): DailyPlannerData => {
  const current = getDailyPlannerData();
  const updatedTasks = current.tasks.map((t) => {
    if (t.id === taskId) {
      return { ...t, isCompleted: !t.isCompleted };
    }
    return t;
  });

  // If any task is completed today, increment streak if not already counted
  return saveDailyPlannerData({ tasks: updatedTasks });
};

export const addCustomPlannerTask = (title: string): DailyPlannerData => {
  const current = getDailyPlannerData();
  const newTask: DailyTask = {
    id: `custom_${Date.now()}`,
    title: title.trim(),
    category: 'custom',
    isCompleted: false,
  };
  return saveDailyPlannerData({ tasks: [...current.tasks, newTask] });
};

export const deletePlannerTask = (taskId: string): DailyPlannerData => {
  const current = getDailyPlannerData();
  const filtered = current.tasks.filter((t) => t.id !== taskId);
  return saveDailyPlannerData({ tasks: filtered });
};

/**
 * Checks if a reminder is due and triggers a browser notification
 */
export const checkAndTriggerDailyReminder = (): boolean => {
  if (typeof window === 'undefined') return false;
  const planner = getDailyPlannerData();
  if (!planner.reminderEnabled || !planner.reminderTime) return false;

  const today = new Date().toISOString().split('T')[0];
  if (planner.lastReminderSentDate === today) {
    return false; // Already sent today
  }

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;

  if (currentTimeString >= planner.reminderTime) {
    // Trigger notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('📖 حان وقت جلستك التجويدية اليومية!', {
          body: `تذكير بموعد المذاكرة المحدد: ${planner.dailyGoalLabel}. واصل سلسلة دراستك المتتالية (${planner.streakCount} أيام)!`,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error('Notification error:', e);
      }
    }

    saveDailyPlannerData({ lastReminderSentDate: today });
    return true;
  }

  return false;
};
