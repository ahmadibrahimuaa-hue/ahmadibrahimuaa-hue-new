import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Upload, Image as ImageIcon, Check, CheckCircle2, 
  Trash2, Save, RotateCcw, Layout, Eye, Megaphone, BookOpen, 
  Award, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { 
  HomeConfig, 
  getHomeConfig, 
  saveHomeConfig, 
  subscribeHomeConfig, 
  DEFAULT_HOME_CONFIG,
  HomeAnnouncementType,
  HomeDefaultView
} from '../utils/homeConfigStorage';
import { compressImage } from '../utils/imageCompressor';

interface PlatformIdentityPanelProps {
  onOpenFullCustomizer?: () => void;
}

export const PlatformIdentityPanel: React.FC<PlatformIdentityPanelProps> = ({
  onOpenFullCustomizer,
}) => {
  const [config, setConfig] = useState<HomeConfig>(() => getHomeConfig());
  const [formData, setFormData] = useState<HomeConfig>(() => getHomeConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeHomeConfig((updated) => {
      setConfig(updated);
      setFormData(updated);
    });
    return () => unsub();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file, 400);
      setFormData((prev) => ({
        ...prev,
        platformLogoUrl: compressedDataUrl,
      }));
      setSuccessMessage('تم تحميل وضغط صورة الشعار بنجاح! احفظ التغييرات لاعتمادها في المنصة.');
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      console.error('Logo compression error:', err);
      setErrorMessage('حدث خطأ أثناء معالجة الصورة: ' + (err?.message || 'حاول مرة أخرى'));
      setTimeout(() => setErrorMessage(''), 4500);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      platformLogoUrl: '',
    }));
    setSuccessMessage('تمت إزالة الشعار واستعادة الرمز المخطوط الافتراضي.');
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await saveHomeConfig({
        platformName: formData.platformName?.trim() || 'مدارج',
        platformLogoUrl: formData.platformLogoUrl || '',
        platformSlogan: formData.platformSlogan || '',
        mainTitle: formData.mainTitle || 'منصة مدارج - المناهج والحقائب التعليمية المقررة',
        subtitle: formData.subtitle || '',
        authorText: formData.authorText || '',
        platformBadgeText: formData.platformBadgeText || '',
        introParagraph: formData.introParagraph || '',
        showAnnouncement: formData.showAnnouncement,
        announcementText: formData.announcementText || '',
        announcementType: formData.announcementType,
        defaultViewMode: formData.defaultViewMode,
      });

      setSuccessMessage('تم حفظ هُوية منصة «مدارج» والشعار والتعديلات بنجاح وتزامنها سحابياً مع جميع المستخدمين!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage('فشل حفظ الإعدادات: ' + (err?.message || 'يرجى التحقق من الاتصال بالإنترنت'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط هُوية المنصة والشعار إلى الإعدادات الافتراضية لمنصة مدارج؟')) {
      setIsSaving(true);
      try {
        await saveHomeConfig({
          ...DEFAULT_HOME_CONFIG,
          platformName: 'مدارج',
          platformLogoUrl: '',
        });
        setSuccessMessage('تمت استعادة الإعدادات الافتراضية لمنصة مدارج بنجاح.');
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err: any) {
        setErrorMessage('فشل إعادة الضبط: ' + err?.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-8 border-2 border-amber-500/30 shadow-2xl space-y-8 font-tajawal dir-rtl">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-700 to-slate-950 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/20 border border-amber-400/40">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-quran text-amber-200">
                إدارة هُوية وشعار منصة «مدارج» والواجهة
              </h2>
              <span className="text-xs bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-bold font-quran">
                الهوية البصرية
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              رفع شعار المنصة، تخصيص الاسم، ضبط العناوين، وإدارة المظهر البصري العام للطلاب بالتزامن السحابي المباشر.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenFullCustomizer && (
            <button
              type="button"
              onClick={onOpenFullCustomizer}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold font-quran flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
            >
              <Layout className="w-4 h-4" />
              <span>تخصيص الواجهة المتقدم</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold font-quran flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-5 py-2 rounded-xl text-xs sm:text-sm font-black font-quran flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات والشعار'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs sm:text-sm p-4 rounded-2xl flex items-center gap-2.5 animate-fadeIn shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs sm:text-sm p-4 rounded-2xl flex items-center gap-2.5 animate-fadeIn shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: LOGO UPLOAD & VISUAL BRAND IDENTITY */}
      <div className="bg-slate-950/80 rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold font-quran text-amber-200">
              1. شعار المنصة الرسمي (Platform Logo)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            يظهر في الهيدر، الصفحة الرئيسية، والشهادات
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Logo Uploader & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-200 font-quran">
                اسم المنصة المعتمد:
              </label>
              <input
                type="text"
                value={formData.platformName || 'مدارج'}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-amber-300 font-quran font-black text-base outline-none transition-colors"
                placeholder="مدارج"
              />
              <p className="text-[11px] text-slate-400">
                اسم المنصة الرئيسي الذي يظهر إلى جانب الشعار في كافة أرجاء المنصة.
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-2xl p-5 bg-slate-900/60 transition-colors text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 mx-auto flex items-center justify-center text-amber-400">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-200 font-quran">
                  ارفع صورة شعار منصة مدارج
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  يدعم صيغ PNG, JPG, WebP, SVG مع ضغط فوري تلقائي لتحقيق أقصى سرعة تحميل.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-black font-quran cursor-pointer flex items-center gap-2 transition-all shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>{isCompressing ? 'جارٍ المعالجة والضغط...' : 'اختر صورة الشعار من جهازك'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isCompressing}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {formData.platformLogoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="bg-rose-950/70 hover:bg-rose-900 text-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold font-quran cursor-pointer flex items-center gap-1.5 border border-rose-800/80 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الشعار واستعادة الرمز</span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-slate-500 font-tajawal block mb-1">
                  أو الصق رابط صورة الشعار مباشرة (URL):
                </span>
                <input
                  type="text"
                  value={formData.platformLogoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, platformLogoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png أو data:image/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono outline-none focus:border-amber-400 text-left dir-ltr"
                />
              </div>
            </div>
          </div>

          {/* Live Mockup Preview Box (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold font-quran text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>معاينة حية لشعار واسم المنصة:</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                مباشر 👁️
              </span>
            </div>

            {/* 1. Header Bar Simulation */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-tajawal">شكل الشعار في شريط التنقل العلوي (Header):</span>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {formData.platformLogoUrl && formData.platformLogoUrl.trim() ? (
                    <img
                      src={formData.platformLogoUrl}
                      alt="معاينة الشعار"
                      className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl p-0.5 border border-amber-400/60 bg-slate-900 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-emerald-800 to-slate-950 flex items-center justify-center text-white shadow-md border border-amber-400/50">
                      <span className="font-quran font-black text-amber-200 text-sm">مـ</span>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black font-quran text-amber-200">
                        {formData.platformName || 'مدارج'}
                      </span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-quran font-bold">
                        تجويد
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400">المنصة التعليمية المتكاملة</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 font-quran">
                  <span>كافة الحقائب ▾</span>
                </div>
              </div>
            </div>

            {/* 2. Hero Banner Simulation */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-tajawal">شكل الشعار في واجهة الهوم الرئيسية:</span>
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-amber-500/20 rounded-xl p-4 text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border-2 border-amber-400/40 mx-auto flex items-center justify-center p-1 shadow-lg">
                  {formData.platformLogoUrl && formData.platformLogoUrl.trim() ? (
                    <img
                      src={formData.platformLogoUrl}
                      alt="معاينة الشعار"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-400 via-emerald-800 to-slate-950 flex items-center justify-center text-white">
                      <span className="font-quran font-black text-amber-200 text-2xl">مـ</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-black font-quran text-amber-200 text-base">
                    {formData.platformName || 'مدارج'}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {formData.platformSlogan || 'منصة مدارج لعلوم التجويد والقرآن الكريم'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SECTION 2: PLATFORM TITLES, SLOGANS & TEXTS */}
      <div className="bg-slate-950/80 rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-bold font-quran text-amber-200">
            2. عناوين ونصوص التوجيه الأكاديمي
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 font-quran">
              الشعار النصي للمنصة (Slogan):
            </label>
            <input
              type="text"
              value={formData.platformSlogan || ''}
              onChange={(e) => setFormData({ ...formData, platformSlogan: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none"
              placeholder="منصة مدارج لعلوم التجويد والقرآن الكريم"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 font-quran">
              شارة المنصة العلوية (Badge):
            </label>
            <input
              type="text"
              value={formData.platformBadgeText || ''}
              onChange={(e) => setFormData({ ...formData, platformBadgeText: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none"
              placeholder="منصة مدارج لعلوم القرآن"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 font-quran">
              العنوان الرئيسي لصفحة المناهج:
            </label>
            <input
              type="text"
              value={formData.mainTitle || ''}
              onChange={(e) => setFormData({ ...formData, mainTitle: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none font-bold"
              placeholder="منصة مدارج - المناهج والحقائب التعليمية المقررة"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 font-quran">
              سطر الإشراف الأكاديمي والتأصيل:
            </label>
            <input
              type="text"
              value={formData.authorText || ''}
              onChange={(e) => setFormData({ ...formData, authorText: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none"
              placeholder="إشراف وتأصيل: أحمد إبراهيم"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 font-quran">
            العنوان الفرعي للمنظومة والمسارات:
          </label>
          <input
            type="text"
            value={formData.subtitle || ''}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none"
            placeholder="منظومة مدارج الرقمية: مسارات تدريبية متدرجة من التأسيس إلى الإتقان والإجازة بالسند"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 font-quran">
            النص التعريفي والتوجيهي في واجهة المنصة:
          </label>
          <textarea
            rows={3}
            value={formData.introParagraph || ''}
            onChange={(e) => setFormData({ ...formData, introParagraph: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xs sm:text-sm text-slate-100 outline-none leading-relaxed"
            placeholder="منظومة منهجية متكاملة لعلوم التجويد تبدأ بالحقيبة التأسيسية الشاملة..."
          />
        </div>
      </div>

      {/* SECTION 3: ANNOUNCEMENT BAR & DEFAULT VIEW */}
      <div className="bg-slate-950/80 rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Megaphone className="w-5 h-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-bold font-quran text-amber-200">
            3. شريط الإعلانات والتنبيهات العلوي
          </h3>
        </div>

        <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 font-quran">
              تفعيل شريط التنبيهات والإعلانات في واجهة المنصة
            </h4>
            <p className="text-[11px] text-slate-400">
              يظهر في أعلى الهوم لتبليغ الطلاب بمواعيد الحلقات أو الاختبارات الجديدة.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showAnnouncement}
              onChange={(e) => setFormData({ ...formData, showAnnouncement: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {formData.showAnnouncement && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 font-quran">
                نص الإعلان أو التنبيه:
              </label>
              <input
                type="text"
                value={formData.announcementText || ''}
                onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none"
                placeholder="أهلاً بكم في منصة مدارج لعلوم التجويد والقرآن الكريم!..."
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">نمط ولون الشريط:</span>
              {(['emerald', 'info', 'warning'] as HomeAnnouncementType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, announcementType: type })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-quran cursor-pointer border transition-all ${
                    formData.announcementType === type
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {type === 'emerald' ? 'زمردي / نجاح 🟢' : type === 'info' ? 'أزرق / معلومة 🔵' : 'ذهبي / تنبيه 🟡'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Bottom Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          💡 جميع التعديلات تحفظ وتزامن فورياً عبر السحاب والتخزين الداخلي لتظهر لكل الطلاب المسجلين بالمنصة.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-black font-quran flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات والشعار'}</span>
        </button>
      </div>

    </div>
  );
};
