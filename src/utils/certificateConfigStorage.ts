import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface CourseCertSettings {
  bgTemplateUrl?: string;
  studentNameTopPct?: number;
  studentNameRightPct?: number;
  studentNameScalePct?: number;
  studentNameColor?: string;
  scoreTopPct?: number;
  scoreRightPct?: number;
  scoreScalePct?: number;
  scoreColor?: string;
  customText1?: string;
  showCustomText1?: boolean;
  customText1TopPct?: number;
  customText1RightPct?: number;
  customText1ScalePct?: number;
  customText1Color?: string;
}

export interface CertificateConfig {
  mainTitle: string;
  headerPraise: string;
  statementPrefix: string;
  courseTitle: string;
  closingDua: string;
  supervisorTitle: string;
  instructorName: string;
  stampTitle: string;
  showStamp: boolean;
  showSignature: boolean;
  customStampUrl?: string;
  customSignatureUrl?: string;
  studentNameStyle?: 'plain' | 'badge-dark' | 'badge-gold' | 'badge-emerald' | 'ribbon-emerald-gold';
  studentNameColor?: string;
  studentNameSize?: 'md' | 'lg' | 'xl' | '2xl';
  frameStyle?: 'gold-double' | 'emerald-double' | 'classic' | 'modern' | 'ornate-royal' | 'minimal-gold' | 'custom-border' | 'islamic-arabesque';
  bgColor?: string;
  certScale?: string; // string representation of percentage e.g. "85"
  certPadding?: 'tight' | 'normal' | 'relaxed' | 'custom';
  customPaddingMm?: number;
  printFit?: 'compact' | 'standard' | 'full';
  stampSize?: 'sm' | 'md' | 'lg';
  signatureSize?: 'sm' | 'md' | 'lg';
  titleColor?: string;
  accentColor?: string;
  textColor?: string;
  bgPattern?: 'none' | 'watermark-quran' | 'watermark-mosque' | 'border-ornament' | 'islamic-gold-frame';
  verticalSpacing?: 'compact' | 'normal' | 'relaxed' | 'ultra-compact';
  // Physical Dimensions & Custom Layout
  paperPreset?: 'a4-landscape' | 'a4-portrait' | 'a5-landscape' | 'letter-landscape' | 'custom';
  customWidthMm?: number;
  customHeightMm?: number;
  fontScalePct?: number; // 70 to 130
  borderWidthMm?: number; // 1 to 20
  layoutMode?: 'classic-center' | 'compact-fit' | 'modern-split';
  // Template Image Mode & Position/Scale Controls
  useBgTemplate?: boolean;
  bgTemplateUrl?: string;
  studentNameTopPct?: number;
  studentNameRightPct?: number;
  studentNameWidthPct?: number;
  studentNameScalePct?: number;
  stampBottomPct?: number;
  stampRightPct?: number;
  stampScalePct?: number;
  sigBottomPct?: number;
  sigLeftPct?: number;
  sigScalePct?: number;
  // Text element toggles
  showMainTitle?: boolean;
  showHeaderPraise?: boolean;
  showStatementPrefix?: boolean;
  showCourseTitle?: boolean;
  showClosingDua?: boolean;
  showSupervisorTitle?: boolean;
  // Additional Custom Text Overlays
  customText1?: string;
  showCustomText1?: boolean;
  customText1TopPct?: number;
  customText1RightPct?: number;
  customText1ScalePct?: number;
  customText1Color?: string;
  customText2?: string;
  showCustomText2?: boolean;
  customText2TopPct?: number;
  customText2RightPct?: number;
  customText2ScalePct?: number;
  customText2Color?: string;
  // Score percentage overlay controls
  scoreTopPct?: number;
  scoreRightPct?: number;
  scoreWidthPct?: number;
  scoreScalePct?: number;
  scoreColor?: string;
  // Legacy Idgham Specific Certificate Template & Overlays
  idghamBgTemplateUrl?: string;
  idghamStudentNameTopPct?: number;
  idghamStudentNameRightPct?: number;
  idghamStudentNameScalePct?: number;
  idghamStudentNameColor?: string;
  idghamScoreTopPct?: number;
  idghamScoreRightPct?: number;
  idghamScoreScalePct?: number;
  idghamScoreColor?: string;
  // Generic Multi-Course Certificate Configurations (Supports any bag!)
  courseCertificates?: Record<string, CourseCertSettings>;
}

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  mainTitle: 'شهادة اجتياز',
  headerPraise: '',
  statementPrefix: 'تشهد إدارة الدورة بأن',
  courseTitle: 'التقاء الساكنين في التلاوة',
  closingDua: 'وذلك بعد اجتيازه/ها المتطلبات والتدريبات الخاصة بالدورة، متمنين له/ها دوام التوفيق والنجاح.',
  supervisorTitle: 'توقيع المجيز',
  instructorName: 'القارئ المقرئ / أحمد إبراهيم',
  stampTitle: 'ختم المجيز',
  showStamp: false,
  showSignature: false,
  showMainTitle: true,
  showHeaderPraise: false,
  showStatementPrefix: true,
  showCourseTitle: true,
  showClosingDua: true,
  showSupervisorTitle: true,
  customStampUrl: '',
  customSignatureUrl: '',
  studentNameStyle: 'plain',
  studentNameSize: 'xl',
  frameStyle: 'gold-double',
  bgColor: '#fffdfa',
  certScale: '85',
  certPadding: 'tight',
  customPaddingMm: 6,
  printFit: 'compact',
  stampSize: 'md',
  signatureSize: 'md',
  titleColor: '#9a3412',
  accentColor: '#d97706',
  textColor: '#1e293b',
  bgPattern: 'none',
  verticalSpacing: 'ultra-compact',
  paperPreset: 'a4-landscape',
  customWidthMm: 297,
  customHeightMm: 210,
  fontScalePct: 92,
  borderWidthMm: 8,
  layoutMode: 'compact-fit',
  useBgTemplate: true,
  bgTemplateUrl: '/certificate_template.jpg',
  studentNameTopPct: 33.8,
  studentNameRightPct: 26,
  studentNameWidthPct: 48,
  studentNameScalePct: 100,
  studentNameColor: '#0f172a',
  scoreTopPct: 56.8,
  scoreRightPct: 38.0,
  scoreWidthPct: 20,
  scoreScalePct: 100,
  scoreColor: '#0f172a',
  stampBottomPct: 8,
  stampRightPct: 12,
  stampScalePct: 100,
  sigBottomPct: 10,
  sigLeftPct: 14,
  sigScalePct: 100,
  customText1: '',
  showCustomText1: false,
  customText1TopPct: 50,
  customText1RightPct: 20,
  customText1ScalePct: 100,
  customText1Color: '#064e3b',
  customText2: '',
  showCustomText2: false,
  customText2TopPct: 60,
  customText2RightPct: 20,
  customText2ScalePct: 100,
  customText2Color: '#064e3b',
};

const LOCAL_STORAGE_KEY = 'tajweed_certificate_config_v10';

export const compressImageDataUrl = (dataUrl: string, maxWidth = 1200, quality = 0.75): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return Promise.resolve(dataUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

const sanitizeConfig = (data: Partial<CertificateConfig>): CertificateConfig => {
  const rawBg = data.bgColor ? data.bgColor.toLowerCase() : '';
  const isDarkBg = rawBg === '#022c22' || rawBg === '#064e3b' || rawBg === '#0b4836' || rawBg === '#063024';
  const finalBgColor = (!data.bgColor || isDarkBg) ? DEFAULT_CERTIFICATE_CONFIG.bgColor : data.bgColor;

  return {
    ...DEFAULT_CERTIFICATE_CONFIG,
    ...data,
    mainTitle: data.mainTitle || DEFAULT_CERTIFICATE_CONFIG.mainTitle,
    headerPraise: data.headerPraise || DEFAULT_CERTIFICATE_CONFIG.headerPraise,
    statementPrefix: data.statementPrefix || DEFAULT_CERTIFICATE_CONFIG.statementPrefix,
    courseTitle: data.courseTitle || DEFAULT_CERTIFICATE_CONFIG.courseTitle,
    closingDua: data.closingDua || DEFAULT_CERTIFICATE_CONFIG.closingDua,
    supervisorTitle: data.supervisorTitle || DEFAULT_CERTIFICATE_CONFIG.supervisorTitle,
    instructorName: data.instructorName || DEFAULT_CERTIFICATE_CONFIG.instructorName,
    stampTitle: data.stampTitle || DEFAULT_CERTIFICATE_CONFIG.stampTitle,
    showStamp: data.showStamp !== undefined ? Boolean(data.showStamp) : DEFAULT_CERTIFICATE_CONFIG.showStamp,
    showSignature: data.showSignature !== undefined ? Boolean(data.showSignature) : DEFAULT_CERTIFICATE_CONFIG.showSignature,
    customStampUrl: (data.customStampUrl && data.customStampUrl.trim()) ? data.customStampUrl : DEFAULT_CERTIFICATE_CONFIG.customStampUrl,
    customSignatureUrl: (data.customSignatureUrl && data.customSignatureUrl.trim()) ? data.customSignatureUrl : DEFAULT_CERTIFICATE_CONFIG.customSignatureUrl,
    studentNameStyle: data.studentNameStyle || DEFAULT_CERTIFICATE_CONFIG.studentNameStyle,
    studentNameColor: data.studentNameColor || DEFAULT_CERTIFICATE_CONFIG.studentNameColor,
    studentNameSize: data.studentNameSize || DEFAULT_CERTIFICATE_CONFIG.studentNameSize,
    frameStyle: data.frameStyle || DEFAULT_CERTIFICATE_CONFIG.frameStyle,
    bgColor: finalBgColor,
    certScale: String(data.certScale || DEFAULT_CERTIFICATE_CONFIG.certScale),
    certPadding: data.certPadding || DEFAULT_CERTIFICATE_CONFIG.certPadding,
    customPaddingMm: Number(data.customPaddingMm ?? DEFAULT_CERTIFICATE_CONFIG.customPaddingMm),
    printFit: data.printFit || DEFAULT_CERTIFICATE_CONFIG.printFit,
    stampSize: data.stampSize || DEFAULT_CERTIFICATE_CONFIG.stampSize,
    signatureSize: data.signatureSize || DEFAULT_CERTIFICATE_CONFIG.signatureSize,
    titleColor: data.titleColor || DEFAULT_CERTIFICATE_CONFIG.titleColor,
    accentColor: data.accentColor || DEFAULT_CERTIFICATE_CONFIG.accentColor,
    textColor: data.textColor || DEFAULT_CERTIFICATE_CONFIG.textColor,
    bgPattern: data.bgPattern || DEFAULT_CERTIFICATE_CONFIG.bgPattern,
    verticalSpacing: data.verticalSpacing || DEFAULT_CERTIFICATE_CONFIG.verticalSpacing,
    paperPreset: data.paperPreset || DEFAULT_CERTIFICATE_CONFIG.paperPreset,
    customWidthMm: Number(data.customWidthMm ?? DEFAULT_CERTIFICATE_CONFIG.customWidthMm),
    customHeightMm: Number(data.customHeightMm ?? DEFAULT_CERTIFICATE_CONFIG.customHeightMm),
    fontScalePct: Number(data.fontScalePct ?? DEFAULT_CERTIFICATE_CONFIG.fontScalePct),
    borderWidthMm: Number(data.borderWidthMm ?? DEFAULT_CERTIFICATE_CONFIG.borderWidthMm),
    layoutMode: data.layoutMode || DEFAULT_CERTIFICATE_CONFIG.layoutMode,
    useBgTemplate: true,
    bgTemplateUrl: (data.bgTemplateUrl && data.bgTemplateUrl.trim()) ? data.bgTemplateUrl : DEFAULT_CERTIFICATE_CONFIG.bgTemplateUrl,
    studentNameTopPct: Number(data.studentNameTopPct ?? DEFAULT_CERTIFICATE_CONFIG.studentNameTopPct),
    studentNameRightPct: Number(data.studentNameRightPct ?? DEFAULT_CERTIFICATE_CONFIG.studentNameRightPct),
    studentNameWidthPct: Number(data.studentNameWidthPct ?? DEFAULT_CERTIFICATE_CONFIG.studentNameWidthPct),
    studentNameScalePct: Number(data.studentNameScalePct ?? DEFAULT_CERTIFICATE_CONFIG.studentNameScalePct),
    scoreTopPct: Number(data.scoreTopPct ?? DEFAULT_CERTIFICATE_CONFIG.scoreTopPct),
    scoreRightPct: Number(data.scoreRightPct ?? DEFAULT_CERTIFICATE_CONFIG.scoreRightPct),
    scoreWidthPct: Number(data.scoreWidthPct ?? DEFAULT_CERTIFICATE_CONFIG.scoreWidthPct),
    scoreScalePct: Number(data.scoreScalePct ?? DEFAULT_CERTIFICATE_CONFIG.scoreScalePct),
    scoreColor: data.scoreColor || DEFAULT_CERTIFICATE_CONFIG.scoreColor,
    stampBottomPct: Number(data.stampBottomPct ?? DEFAULT_CERTIFICATE_CONFIG.stampBottomPct),
    stampRightPct: Number(data.stampRightPct ?? DEFAULT_CERTIFICATE_CONFIG.stampRightPct),
    stampScalePct: Number(data.stampScalePct ?? DEFAULT_CERTIFICATE_CONFIG.stampScalePct),
    sigBottomPct: Number(data.sigBottomPct ?? DEFAULT_CERTIFICATE_CONFIG.sigBottomPct),
    sigLeftPct: Number(data.sigLeftPct ?? DEFAULT_CERTIFICATE_CONFIG.sigLeftPct),
    sigScalePct: Number(data.sigScalePct ?? DEFAULT_CERTIFICATE_CONFIG.sigScalePct),
    showMainTitle: data.showMainTitle !== undefined ? Boolean(data.showMainTitle) : DEFAULT_CERTIFICATE_CONFIG.showMainTitle,
    showHeaderPraise: data.showHeaderPraise !== undefined ? Boolean(data.showHeaderPraise) : DEFAULT_CERTIFICATE_CONFIG.showHeaderPraise,
    showStatementPrefix: data.showStatementPrefix !== undefined ? Boolean(data.showStatementPrefix) : DEFAULT_CERTIFICATE_CONFIG.showStatementPrefix,
    showCourseTitle: data.showCourseTitle !== undefined ? Boolean(data.showCourseTitle) : DEFAULT_CERTIFICATE_CONFIG.showCourseTitle,
    showClosingDua: data.showClosingDua !== undefined ? Boolean(data.showClosingDua) : DEFAULT_CERTIFICATE_CONFIG.showClosingDua,
    showSupervisorTitle: data.showSupervisorTitle !== undefined ? Boolean(data.showSupervisorTitle) : DEFAULT_CERTIFICATE_CONFIG.showSupervisorTitle,
    customText1: data.customText1 ?? DEFAULT_CERTIFICATE_CONFIG.customText1,
    showCustomText1: data.showCustomText1 !== undefined ? Boolean(data.showCustomText1) : DEFAULT_CERTIFICATE_CONFIG.showCustomText1,
    customText1TopPct: Number(data.customText1TopPct ?? DEFAULT_CERTIFICATE_CONFIG.customText1TopPct),
    customText1RightPct: Number(data.customText1RightPct ?? DEFAULT_CERTIFICATE_CONFIG.customText1RightPct),
    customText1ScalePct: Number(data.customText1ScalePct ?? DEFAULT_CERTIFICATE_CONFIG.customText1ScalePct),
    customText1Color: data.customText1Color || DEFAULT_CERTIFICATE_CONFIG.customText1Color,
    customText2: data.customText2 ?? DEFAULT_CERTIFICATE_CONFIG.customText2,
    showCustomText2: data.showCustomText2 !== undefined ? Boolean(data.showCustomText2) : DEFAULT_CERTIFICATE_CONFIG.showCustomText2,
    customText2TopPct: Number(data.customText2TopPct ?? DEFAULT_CERTIFICATE_CONFIG.customText2TopPct),
    customText2RightPct: Number(data.customText2RightPct ?? DEFAULT_CERTIFICATE_CONFIG.customText2RightPct),
    customText2ScalePct: Number(data.customText2ScalePct ?? DEFAULT_CERTIFICATE_CONFIG.customText2ScalePct),
    customText2Color: data.customText2Color || DEFAULT_CERTIFICATE_CONFIG.customText2Color,
    idghamBgTemplateUrl: data.idghamBgTemplateUrl || '',
    idghamStudentNameTopPct: Number(data.idghamStudentNameTopPct ?? 33.8),
    idghamStudentNameRightPct: Number(data.idghamStudentNameRightPct ?? 26),
    idghamStudentNameScalePct: Number(data.idghamStudentNameScalePct ?? 100),
    idghamStudentNameColor: data.idghamStudentNameColor || '#0f172a',
    idghamScoreTopPct: Number(data.idghamScoreTopPct ?? 56.8),
    idghamScoreRightPct: Number(data.idghamScoreRightPct ?? 38.0),
    idghamScoreScalePct: Number(data.idghamScoreScalePct ?? 100),
    idghamScoreColor: data.idghamScoreColor || '#0f172a',
    courseCertificates: data.courseCertificates ? { ...data.courseCertificates } : {},
  };
};

export const getCourseCertSettings = (
  config: CertificateConfig,
  courseId: string = 'sakinan'
): CourseCertSettings => {
  if (config.courseCertificates && config.courseCertificates[courseId]) {
    const s = config.courseCertificates[courseId];
    return {
      bgTemplateUrl: s.bgTemplateUrl || (courseId === 'idgham' ? config.idghamBgTemplateUrl : config.bgTemplateUrl) || '/certificate_template.jpg',
      studentNameTopPct: Number(s.studentNameTopPct ?? (courseId === 'idgham' ? config.idghamStudentNameTopPct : config.studentNameTopPct) ?? 33.8),
      studentNameRightPct: Number(s.studentNameRightPct ?? (courseId === 'idgham' ? config.idghamStudentNameRightPct : config.studentNameRightPct) ?? 26),
      studentNameScalePct: Number(s.studentNameScalePct ?? (courseId === 'idgham' ? config.idghamStudentNameScalePct : config.studentNameScalePct) ?? 100),
      studentNameColor: s.studentNameColor || (courseId === 'idgham' ? config.idghamStudentNameColor : config.studentNameColor) || '#0f172a',
      scoreTopPct: Number(s.scoreTopPct ?? (courseId === 'idgham' ? config.idghamScoreTopPct : config.scoreTopPct) ?? 56.8),
      scoreRightPct: Number(s.scoreRightPct ?? (courseId === 'idgham' ? config.idghamScoreRightPct : config.scoreRightPct) ?? 38.0),
      scoreScalePct: Number(s.scoreScalePct ?? (courseId === 'idgham' ? config.idghamScoreScalePct : config.scoreScalePct) ?? 100),
      scoreColor: s.scoreColor || (courseId === 'idgham' ? config.idghamScoreColor : config.scoreColor) || '#0f172a',
      customText1: s.customText1 ?? '',
      showCustomText1: Boolean(s.showCustomText1),
      customText1TopPct: Number(s.customText1TopPct ?? 50),
      customText1RightPct: Number(s.customText1RightPct ?? 20),
      customText1ScalePct: Number(s.customText1ScalePct ?? 100),
      customText1Color: s.customText1Color || '#064e3b',
    };
  }

  // Legacy fallback for idgham
  if (courseId === 'idgham') {
    return {
      bgTemplateUrl: config.idghamBgTemplateUrl || config.bgTemplateUrl || '/certificate_template.jpg',
      studentNameTopPct: Number(config.idghamStudentNameTopPct ?? config.studentNameTopPct ?? 33.8),
      studentNameRightPct: Number(config.idghamStudentNameRightPct ?? config.studentNameRightPct ?? 26),
      studentNameScalePct: Number(config.idghamStudentNameScalePct ?? config.studentNameScalePct ?? 100),
      studentNameColor: config.idghamStudentNameColor || config.studentNameColor || '#0f172a',
      scoreTopPct: Number(config.idghamScoreTopPct ?? config.scoreTopPct ?? 56.8),
      scoreRightPct: Number(config.idghamScoreRightPct ?? config.scoreRightPct ?? 38.0),
      scoreScalePct: Number(config.idghamScoreScalePct ?? config.scoreScalePct ?? 100),
      scoreColor: config.idghamScoreColor || config.scoreColor || '#0f172a',
      customText1: config.customText1 ?? '',
      showCustomText1: Boolean(config.showCustomText1),
      customText1TopPct: Number(config.customText1TopPct ?? 50),
      customText1RightPct: Number(config.customText1RightPct ?? 20),
      customText1ScalePct: Number(config.customText1ScalePct ?? 100),
      customText1Color: config.customText1Color || '#064e3b',
    };
  }

  // Default sakinan or base config
  return {
    bgTemplateUrl: config.bgTemplateUrl || '/certificate_template.jpg',
    studentNameTopPct: Number(config.studentNameTopPct ?? 33.8),
    studentNameRightPct: Number(config.studentNameRightPct ?? 26),
    studentNameScalePct: Number(config.studentNameScalePct ?? 100),
    studentNameColor: config.studentNameColor || '#0f172a',
    scoreTopPct: Number(config.scoreTopPct ?? 56.8),
    scoreRightPct: Number(config.scoreRightPct ?? 38.0),
    scoreScalePct: Number(config.scoreScalePct ?? 100),
    scoreColor: config.scoreColor || '#0f172a',
    customText1: config.customText1 ?? '',
    showCustomText1: Boolean(config.showCustomText1),
    customText1TopPct: Number(config.customText1TopPct ?? 50),
    customText1RightPct: Number(config.customText1RightPct ?? 20),
    customText1ScalePct: Number(config.customText1ScalePct ?? 100),
    customText1Color: config.customText1Color || '#064e3b',
  };
};

export const updateCourseCertSettingsInConfig = (
  prevConfig: CertificateConfig,
  courseId: string,
  partial: Partial<CourseCertSettings>
): CertificateConfig => {
  const currentSettings = getCourseCertSettings(prevConfig, courseId);
  const updatedSettings: CourseCertSettings = {
    ...currentSettings,
    ...partial,
  };

  const nextCourseCerts = {
    ...(prevConfig.courseCertificates || {}),
    [courseId]: updatedSettings,
  };

  const nextConfig: CertificateConfig = {
    ...prevConfig,
    courseCertificates: nextCourseCerts,
  };

  // Sync back to top-level if it's sakinan or idgham for backward compatibility
  if (courseId === 'sakinan') {
    if (partial.bgTemplateUrl !== undefined) nextConfig.bgTemplateUrl = partial.bgTemplateUrl;
    if (partial.studentNameTopPct !== undefined) nextConfig.studentNameTopPct = partial.studentNameTopPct;
    if (partial.studentNameRightPct !== undefined) nextConfig.studentNameRightPct = partial.studentNameRightPct;
    if (partial.studentNameScalePct !== undefined) nextConfig.studentNameScalePct = partial.studentNameScalePct;
    if (partial.studentNameColor !== undefined) nextConfig.studentNameColor = partial.studentNameColor;
    if (partial.scoreTopPct !== undefined) nextConfig.scoreTopPct = partial.scoreTopPct;
    if (partial.scoreRightPct !== undefined) nextConfig.scoreRightPct = partial.scoreRightPct;
    if (partial.scoreScalePct !== undefined) nextConfig.scoreScalePct = partial.scoreScalePct;
    if (partial.scoreColor !== undefined) nextConfig.scoreColor = partial.scoreColor;
  } else if (courseId === 'idgham') {
    if (partial.bgTemplateUrl !== undefined) nextConfig.idghamBgTemplateUrl = partial.bgTemplateUrl;
    if (partial.studentNameTopPct !== undefined) nextConfig.idghamStudentNameTopPct = partial.studentNameTopPct;
    if (partial.studentNameRightPct !== undefined) nextConfig.idghamStudentNameRightPct = partial.studentNameRightPct;
    if (partial.studentNameScalePct !== undefined) nextConfig.idghamStudentNameScalePct = partial.studentNameScalePct;
    if (partial.studentNameColor !== undefined) nextConfig.idghamStudentNameColor = partial.studentNameColor;
    if (partial.scoreTopPct !== undefined) nextConfig.idghamScoreTopPct = partial.scoreTopPct;
    if (partial.scoreRightPct !== undefined) nextConfig.idghamScoreRightPct = partial.scoreRightPct;
    if (partial.scoreScalePct !== undefined) nextConfig.idghamScoreScalePct = partial.scoreScalePct;
    if (partial.scoreColor !== undefined) nextConfig.idghamScoreColor = partial.scoreColor;
  }

  return nextConfig;
};

export const getCertificateConfig = (): CertificateConfig => {
  if (typeof window === 'undefined') return DEFAULT_CERTIFICATE_CONFIG;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return sanitizeConfig(JSON.parse(data));
    }
  } catch (err) {
    console.warn('Failed to read certificate config from localStorage', err);
  }
  return DEFAULT_CERTIFICATE_CONFIG;
};

export const saveCertificateConfig = async (config: CertificateConfig): Promise<CertificateConfig> => {
  let toSave = { ...config };
  if (toSave.bgTemplateUrl && toSave.bgTemplateUrl.startsWith('data:image')) {
    try {
      toSave.bgTemplateUrl = await compressImageDataUrl(toSave.bgTemplateUrl);
    } catch (e) {
      console.warn('Image compression failed, using original', e);
    }
  }

  if (toSave.idghamBgTemplateUrl && toSave.idghamBgTemplateUrl.startsWith('data:image')) {
    try {
      toSave.idghamBgTemplateUrl = await compressImageDataUrl(toSave.idghamBgTemplateUrl);
    } catch (e) {
      console.warn('Image compression failed, using original', e);
    }
  }

  if (toSave.courseCertificates) {
    for (const cId of Object.keys(toSave.courseCertificates)) {
      const entry = toSave.courseCertificates[cId];
      if (entry.bgTemplateUrl && entry.bgTemplateUrl.startsWith('data:image')) {
        try {
          entry.bgTemplateUrl = await compressImageDataUrl(entry.bgTemplateUrl);
        } catch (e) {
          console.warn(`Image compression failed for course ${cId}`, e);
        }
      }
    }
  }

  const sanitized = sanitizeConfig(toSave);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
  }

  try {
    const configRef = doc(db, 'settings', 'certificateConfig');
    await setDoc(configRef, {
      ...sanitized,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.error('Firestore save for certificate config failed:', err);
    throw err;
  }

  return sanitized;
};

export const subscribeCertificateConfig = (callback: (config: CertificateConfig) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  // Initial call with local state
  callback(getCertificateConfig());

  try {
    const configRef = doc(db, 'settings', 'certificateConfig');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as Partial<CertificateConfig>;
        const merged = sanitizeConfig(remoteData);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        }
        callback(merged);
      }
    }, (error) => {
      console.warn('Firestore subscription warning:', error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to Firestore certificate config:', err);
    return () => {};
  }
};
