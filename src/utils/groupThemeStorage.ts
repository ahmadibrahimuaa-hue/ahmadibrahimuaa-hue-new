import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { GroupThemeConfig, ThemePreset } from '../types';

const THEMES_STORAGE_KEY = 'tajweed_group_themes_v1';
const ACTIVE_OVERRIDE_GROUP_KEY = 'tajweed_active_preview_group';

// Pre-configured institute / group themes
export const DEFAULT_GROUP_THEMES: GroupThemeConfig[] = [
  {
    groupId: 'حلقة الإتقان المسائية',
    groupName: 'حلقة الإتقان المسائية',
    instituteName: 'معهد الإتقان العالي لعلوم القرآن',
    instituteSubtitle: 'مسار التجويد التطبيقي والدراية الإسنادية',
    logoIcon: 'quran',
    themePreset: 'emerald',
    customBadgeText: 'دفعة الإتقان المعتمدة 🌿',
    welcomeMessage: 'أهلاً بكم في المنصة التعليمية لطلاب حلقة الإتقان المسائية - مرحباً بفرسان القرآن!',
    updatedAt: Date.now(),
  },
  {
    groupId: 'دفعة الإجازة المتقدمة',
    groupName: 'دفعة الإجازة المتقدمة',
    instituteName: 'مقرأة الروايات والإجازات المسندة',
    instituteSubtitle: 'برنامج تأهيل حفظة القرآن للحصول على السند المتصل',
    logoIcon: 'crown',
    themePreset: 'royal_purple',
    customBadgeText: 'دفعة الإجازة بالسند 👑',
    welcomeMessage: 'مرحباً بطلاب دفعة الإجازة بالسند المتصل - نسأل الله لكم التمام والقبول.',
    updatedAt: Date.now(),
  },
  {
    groupId: 'معهد الفرقان',
    groupName: 'معهد الفرقان',
    instituteName: 'معهد الفرقان لتأصيل التجويد والقراءات',
    instituteSubtitle: 'الشعبة الأكاديمية - الرياض والشارقة',
    logoIcon: 'landmark',
    themePreset: 'ocean_blue',
    customBadgeText: 'معتمد لطلاب معهد الفرقان 🏛️',
    welcomeMessage: 'أهلاً وسهلاً بطلاب ودارسي معهد الفرقان في بيئتكم التعليمية الرقمية المخصصة.',
    updatedAt: Date.now(),
  },
  {
    groupId: 'حلقة التأسيس الصباحية',
    groupName: 'حلقة التأسيس الصباحية',
    instituteName: 'أكاديمية الماهر بالقرآن للتأسيس المتين',
    instituteSubtitle: 'مسار المبتدئين - من الحرف إلى الإتقان',
    logoIcon: 'sparkles',
    themePreset: 'amber_gold',
    customBadgeText: 'أكاديمية الماهر للتأسيس ⭐',
    welcomeMessage: 'صباح الهمة والإنجاز! رتّل بارتقاء مع مسار التأسيس القرآني الرصين.',
    updatedAt: Date.now(),
  },
  {
    groupId: 'حلقة المتميزين',
    groupName: 'حلقة المتميزين',
    instituteName: 'مركز الحفاظ النجباء',
    instituteSubtitle: 'رعاية المواهب القرآنية ودقائق التحريرات',
    logoIcon: 'award',
    themePreset: 'ruby_crimson',
    customBadgeText: 'نخبة الحفاظ النجباء 🏅',
    welcomeMessage: 'مرحباً بصفوة الحفاظ والمتميزين في رحاب دقائق علم التجويد.',
    updatedAt: Date.now(),
  },
];

export const getThemePresetDetails = (preset: ThemePreset = 'emerald') => {
  switch (preset) {
    case 'royal_purple':
      return {
        key: 'royal_purple',
        name: 'الأرجواني الملكي الإسنادي',
        bannerGradient: 'from-purple-950 via-slate-900 to-indigo-950',
        cardBorder: 'border-purple-500/50',
        badgeBg: 'bg-purple-900/60 text-purple-200 border-purple-500/40',
        accentColor: '#a855f7',
        primaryColor: '#7e22ce',
        cardGlow: 'shadow-purple-500/10',
        pillBg: 'bg-purple-600 hover:bg-purple-500 text-white',
        textHighlight: 'text-purple-300',
        ringColor: 'ring-purple-400',
      };
    case 'ocean_blue':
      return {
        key: 'ocean_blue',
        name: 'الأزرق المحيطي الوقور',
        bannerGradient: 'from-sky-950 via-slate-900 to-blue-950',
        cardBorder: 'border-sky-500/50',
        badgeBg: 'bg-sky-900/60 text-sky-200 border-sky-500/40',
        accentColor: '#38bdf8',
        primaryColor: '#0284c7',
        cardGlow: 'shadow-sky-500/10',
        pillBg: 'bg-sky-600 hover:bg-sky-500 text-white',
        textHighlight: 'text-sky-300',
        ringColor: 'ring-sky-400',
      };
    case 'amber_gold':
      return {
        key: 'amber_gold',
        name: 'الذهبي العنبري الأصيل',
        bannerGradient: 'from-amber-950 via-slate-900 to-yellow-950',
        cardBorder: 'border-amber-500/50',
        badgeBg: 'bg-amber-900/60 text-amber-200 border-amber-500/40',
        accentColor: '#fbbf24',
        primaryColor: '#d97706',
        cardGlow: 'shadow-amber-500/10',
        pillBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
        textHighlight: 'text-amber-300',
        ringColor: 'ring-amber-400',
      };
    case 'ruby_crimson':
      return {
        key: 'ruby_crimson',
        name: 'العنابي الياقوتي الأندلسي',
        bannerGradient: 'from-rose-950 via-slate-900 to-red-950',
        cardBorder: 'border-rose-500/50',
        badgeBg: 'bg-rose-900/60 text-rose-200 border-rose-500/40',
        accentColor: '#f43f5e',
        primaryColor: '#e11d48',
        cardGlow: 'shadow-rose-500/10',
        pillBg: 'bg-rose-600 hover:bg-rose-500 text-white',
        textHighlight: 'text-rose-300',
        ringColor: 'ring-rose-400',
      };
    case 'slate_dark':
      return {
        key: 'slate_dark',
        name: 'الداكن الرخامي الفاخر',
        bannerGradient: 'from-slate-950 via-zinc-900 to-slate-950',
        cardBorder: 'border-amber-400/40',
        badgeBg: 'bg-slate-800 text-slate-200 border-amber-400/30',
        accentColor: '#f59e0b',
        primaryColor: '#475569',
        cardGlow: 'shadow-amber-400/5',
        pillBg: 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40',
        textHighlight: 'text-amber-300',
        ringColor: 'ring-amber-400',
      };
    case 'emerald':
    default:
      return {
        key: 'emerald',
        name: 'الزمردي القرآني الكلاسيكي',
        bannerGradient: 'from-emerald-950 via-slate-900 to-emerald-950',
        cardBorder: 'border-emerald-500/50',
        badgeBg: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40',
        accentColor: '#34d399',
        primaryColor: '#059669',
        cardGlow: 'shadow-emerald-500/10',
        pillBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        textHighlight: 'text-emerald-300',
        ringColor: 'ring-emerald-400',
      };
  }
};

export const getStoredGroupThemes = (): GroupThemeConfig[] => {
  if (typeof window === 'undefined') return DEFAULT_GROUP_THEMES;
  try {
    const raw = localStorage.getItem(THEMES_STORAGE_KEY);
    if (!raw) return DEFAULT_GROUP_THEMES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_GROUP_THEMES;
    return parsed;
  } catch (err) {
    console.warn('Failed to parse group themes from storage:', err);
    return DEFAULT_GROUP_THEMES;
  }
};

export const saveStoredGroupThemes = (themes: GroupThemeConfig[]): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
    window.dispatchEvent(new CustomEvent('tajweed_group_themes_updated', { detail: themes }));
    return true;
  } catch (err) {
    console.error('Failed to save group themes:', err);
    return false;
  }
};

export const upsertGroupTheme = async (theme: GroupThemeConfig): Promise<boolean> => {
  const themes = getStoredGroupThemes();
  const existingIdx = themes.findIndex((t) => t.groupId === theme.groupId);
  let updated: GroupThemeConfig[];
  
  const preparedTheme: GroupThemeConfig = {
    ...theme,
    updatedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    updated = [...themes];
    updated[existingIdx] = preparedTheme;
  } else {
    updated = [preparedTheme, ...themes];
  }

  saveStoredGroupThemes(updated);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'group_themes', theme.groupId);
    await setDoc(docRef, preparedTheme, { merge: true });
  } catch (err) {
    console.warn('Firestore group theme sync failed:', err);
  }

  return true;
};

export const deleteGroupTheme = async (groupId: string): Promise<boolean> => {
  const themes = getStoredGroupThemes();
  const filtered = themes.filter((t) => t.groupId !== groupId);
  saveStoredGroupThemes(filtered);
  return true;
};

export const subscribeGroupThemes = (callback: (themes: GroupThemeConfig[]) => void): (() => void) => {
  const handler = () => {
    callback(getStoredGroupThemes());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tajweed_group_themes_updated', handler);
    window.addEventListener('storage', handler);
  }

  // Also initial call
  callback(getStoredGroupThemes());

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('tajweed_group_themes_updated', handler);
      window.removeEventListener('storage', handler);
    }
  };
};

/**
 * Get active theme configuration for a student group or preview override
 */
export const getActiveThemeForStudent = (studentGroupName?: string): GroupThemeConfig | null => {
  // Check if preview override is set (useful for teacher to test different institutes)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(ACTIVE_OVERRIDE_GROUP_KEY);
    if (override) {
      const themes = getStoredGroupThemes();
      const match = themes.find((t) => t.groupId === override || t.groupName === override);
      if (match) return match;
    }
  }

  if (!studentGroupName) return null;

  const themes = getStoredGroupThemes();
  const normalizedQuery = studentGroupName.trim().toLowerCase();
  
  const found = themes.find((t) => 
    t.groupId.toLowerCase() === normalizedQuery ||
    t.groupName.toLowerCase() === normalizedQuery ||
    normalizedQuery.includes(t.groupId.toLowerCase()) ||
    t.groupId.toLowerCase().includes(normalizedQuery)
  );

  return found || null;
};

export const setActivePreviewGroup = (groupId: string | null) => {
  if (typeof window === 'undefined') return;
  if (!groupId) {
    localStorage.removeItem(ACTIVE_OVERRIDE_GROUP_KEY);
  } else {
    localStorage.setItem(ACTIVE_OVERRIDE_GROUP_KEY, groupId);
  }
  window.dispatchEvent(new CustomEvent('tajweed_group_themes_updated', { detail: getStoredGroupThemes() }));
};

export const getActivePreviewGroup = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_OVERRIDE_GROUP_KEY);
};

// Aliases for unified interface
export const getAllGroupThemes = getStoredGroupThemes;

export const getGroupTheme = (groupId: string): GroupThemeConfig | undefined => {
  const list = getStoredGroupThemes();
  return list.find((t) => t.groupId === groupId || t.groupName === groupId);
};

export const saveGroupTheme = upsertGroupTheme;

export const getActiveStudentGroup = getActivePreviewGroup;

export const setActiveStudentGroup = (group: string | null) => {
  setActivePreviewGroup(group);
};
