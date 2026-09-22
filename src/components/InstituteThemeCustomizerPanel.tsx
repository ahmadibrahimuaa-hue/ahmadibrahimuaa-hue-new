import React, { useState, useEffect } from 'react';
import { 
  Palette, Landmark, Crown, Award, Book, Sparkles, Building, Check, 
  Save, RotateCcw, Eye, Search, PlusCircle, Trash2, Edit3, Image as ImageIcon, 
  Star, ShieldCheck, CheckCircle2, ChevronRight, Layers, ArrowLeft,
  GraduationCap, ExternalLink, Info, RefreshCw
} from 'lucide-react';
import { GroupThemeConfig, ThemePreset } from '../types';
import { 
  getAllGroupThemes, 
  getGroupTheme, 
  saveGroupTheme, 
  deleteGroupTheme, 
  getActiveStudentGroup, 
  setActiveStudentGroup, 
  getThemePresetDetails,
  DEFAULT_GROUP_THEMES,
  subscribeGroupThemes
} from '../utils/groupThemeStorage';

interface InstituteThemeCustomizerPanelProps {
  onApplyThemeToPreview?: (groupId: string) => void;
}

export const InstituteThemeCustomizerPanel: React.FC<InstituteThemeCustomizerPanelProps> = ({
  onApplyThemeToPreview
}) => {
  const [themes, setThemes] = useState<GroupThemeConfig[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('معهد الفرقان');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePreviewGroup, setActivePreviewGroup] = useState<string>(getActiveStudentGroup());

  // Form state for editing
  const [currentEdit, setCurrentEdit] = useState<GroupThemeConfig>({
    groupId: '',
    groupName: '',
    instituteName: '',
    instituteSubtitle: '',
    logoIcon: 'landmark',
    logoUrl: '',
    themePreset: 'emerald',
    customBadgeText: '',
    welcomeMessage: '',
    bannerImageUrl: '',
  });

  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load and subscribe to themes
  useEffect(() => {
    const loaded = getAllGroupThemes();
    setThemes(loaded);
    if (loaded.length > 0 && !selectedGroupId) {
      setSelectedGroupId(loaded[0].groupId);
    }

    const unsub = subscribeGroupThemes((updated) => {
      setThemes(updated);
    });
    return () => unsub();
  }, []);

  // Update currentEdit when selectedGroupId changes
  useEffect(() => {
    if (isCreatingNew) return;
    const found = themes.find((t) => t.groupId === selectedGroupId) || themes[0];
    if (found) {
      setCurrentEdit({ ...found });
    }
  }, [selectedGroupId, themes, isCreatingNew]);

  const handleSelectTheme = (groupId: string) => {
    setIsCreatingNew(false);
    setSelectedGroupId(groupId);
    setStatusMessage(null);
  };

  const handleStartCreateNew = () => {
    setIsCreatingNew(true);
    setCurrentEdit({
      groupId: `معهد_${Date.now()}`,
      groupName: 'دفعة جديدة',
      instituteName: 'اسم المعهد أو المقرأة القرآنية',
      instituteSubtitle: 'المسار التعليمي أو الشعبة الأكاديمية',
      logoIcon: 'quran',
      logoUrl: '',
      themePreset: 'royal_purple',
      customBadgeText: 'دفعة معتمدة 🌿',
      welcomeMessage: 'مرحباً بطلابنا الكرام في بيئتكم التعليمية المخصصة.',
      bannerImageUrl: '',
    });
    setStatusMessage(null);
  };

  const handleSave = () => {
    if (!currentEdit.groupName.trim() || !currentEdit.instituteName.trim()) {
      setStatusMessage({ type: 'error', text: 'يرجى إدخال اسم المجموعة واسم المعهد' });
      return;
    }

    const configToSave: GroupThemeConfig = {
      ...currentEdit,
      groupId: currentEdit.groupId.trim() || currentEdit.groupName.trim(),
      updatedAt: Date.now(),
    };

    saveGroupTheme(configToSave);
    setIsCreatingNew(false);
    setSelectedGroupId(configToSave.groupId);
    setStatusMessage({ type: 'success', text: `تم حفظ تخصيص "${configToSave.instituteName}" بنجاح!` });

    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleSetAsActivePreview = (groupId: string) => {
    setActiveStudentGroup(groupId);
    setActivePreviewGroup(groupId);
    if (onApplyThemeToPreview) {
      onApplyThemeToPreview(groupId);
    }
    setStatusMessage({
      type: 'success',
      text: `تم تفعيل واجهة "${groupId}" كمعاينة نشطة لصفحات الطالب!`,
    });
  };

  const handleDelete = (groupId: string) => {
    if (themes.length <= 1) {
      setStatusMessage({ type: 'error', text: 'لا يمكن حذف كافة المعاهد، يجب الإبقاء على معهد واحد على الأقل.' });
      return;
    }
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف تخصيص "${groupId}"؟`)) {
      deleteGroupTheme(groupId);
      const remaining = themes.filter((t) => t.groupId !== groupId);
      setThemes(remaining);
      setSelectedGroupId(remaining[0].groupId);
      setStatusMessage({ type: 'success', text: 'تم حذف المعهد المحدد.' });
    }
  };

  // Filter themes by search
  const filteredThemes = themes.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.groupName.toLowerCase().includes(q) ||
      t.instituteName.toLowerCase().includes(q) ||
      (t.instituteSubtitle && t.instituteSubtitle.toLowerCase().includes(q))
    );
  });

  const presetDetails = getThemePresetDetails(currentEdit.themePreset);

  const availablePresets: { key: ThemePreset; name: string; color: string }[] = [
    { key: 'emerald', name: 'الزمردي القرآني', color: '#059669' },
    { key: 'royal_purple', name: 'الأرجواني الملكي', color: '#9333ea' },
    { key: 'amber_gold', name: 'الذهبي العنبري', color: '#d97706' },
    { key: 'ocean_blue', name: 'الأزرق المحيطي', color: '#0284c7' },
    { key: 'ruby_crimson', name: 'العنابي الياقوتي', color: '#e11d48' },
    { key: 'slate_dark', name: 'الرخامي الداكن', color: '#334155' },
  ];

  const logoIcons: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'quran', label: 'مصحف شريف', icon: <Book className="w-5 h-5" /> },
    { key: 'crown', label: 'تاج السند', icon: <Crown className="w-5 h-5" /> },
    { key: 'landmark', label: 'صرح / معهد', icon: <Landmark className="w-5 h-5" /> },
    { key: 'award', label: 'وسام إتقان', icon: <Award className="w-5 h-5" /> },
    { key: 'sparkles', label: 'نور التجويد', icon: <Sparkles className="w-5 h-5" /> },
    { key: 'graduation-cap', label: 'قبعة إجازة', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border-2 border-amber-400/40 shadow-2xl space-y-6 font-tajawal dir-rtl text-right">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Palette className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-quran">
                تخصيص الواجهات للمؤسسات والمعاهد
              </span>
              <span className="text-xs text-slate-400">
                ({themes.length} معاهد ومجموعات مهيأة)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-quran text-amber-100 mt-1">
              تخصيص ألوان وشعار الواجهة لكل معهد ومجموعة طلابية
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStartCreateNew}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-quran px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة معهد / حلقة جديدة ➕</span>
          </button>
        </div>
      </div>

      {/* Active Student View Indicator */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Eye className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-400">المظهر المطبق حالياً في معاينة الطالب: </span>
            <span className="font-bold text-amber-300 font-quran">«{activePreviewGroup}»</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          💡 يمكنك اختيار أي معهد أدناه والضغط على «تعيين كمعاينة نشطة» لتجربة الواجهة فوراً كطالب
        </span>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500' 
            : 'bg-rose-950/90 text-rose-200 border border-rose-500'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Left Column = Institutes List, Right Column = Customization Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Institutes & Groups List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-amber-300 font-quran flex items-center gap-1.5">
              <Building className="w-4 h-4 text-amber-400" />
              <span>قائمة المعاهد والمجموعات</span>
            </h4>
            <span className="text-[11px] text-slate-400">{filteredThemes.length} نتائج</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن معهد أو حلقة..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400"
            />
          </div>

          {/* Theme list cards */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredThemes.map((item) => {
              const isSelected = !isCreatingNew && selectedGroupId === item.groupId;
              const isLive = activePreviewGroup === item.groupId;
              const itemPreset = getThemePresetDetails(item.themePreset);

              return (
                <div
                  key={item.groupId}
                  onClick={() => handleSelectTheme(item.groupId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-right ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                      style={{ backgroundColor: itemPreset.primaryColor }}
                    >
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-100 font-quran truncate">
                          {item.instituteName}
                        </span>
                        {isLive && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.2 rounded-md font-sans">
                            نشط
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.groupName} • {itemPreset.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: itemPreset.accentColor }}
                      title={itemPreset.name}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customization Editor (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] text-amber-400 font-bold block">
                {isCreatingNew ? 'إضافة معهد جديد' : 'تعديل تخصيص المعهد المحدد'}
              </span>
              <h4 className="text-base font-bold font-quran text-slate-100">
                {currentEdit.instituteName || 'معهد قرآني جديد'}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => handleSetAsActivePreview(currentEdit.groupId)}
                  className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/50 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="تفعيل هذا المعهد كمعاينة للطالب"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>معاينة كتجربة الطالب</span>
                </button>
              )}

              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => handleDelete(currentEdit.groupId)}
                  className="text-rose-400 hover:text-rose-300 p-2 rounded-xl hover:bg-rose-950/50 transition-colors"
                  title="حذف هذا المعهد"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Institute Name */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">اسم المعهد أو المقرأة الرسمية *</label>
              <input
                type="text"
                value={currentEdit.instituteName}
                onChange={(e) => setCurrentEdit({ ...currentEdit, instituteName: e.target.value })}
                placeholder="مثال: معهد الفرقان لتأصيل التجويد والقراءات"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-2.5 text-slate-100 outline-none"
              />
            </div>

            {/* Group / Cohort Name */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">اسم المجموعة الطلابية أو الدفعة *</label>
              <input
                type="text"
                value={currentEdit.groupName}
                onChange={(e) => setCurrentEdit({ ...currentEdit, groupName: e.target.value })}
                placeholder="مثال: حلقة الإتقان المسائية / دفعة السند 1446هـ"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-2.5 text-slate-100 outline-none"
              />
            </div>

            {/* Subtitle / Motto */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-300 font-bold">الشعار اللفظي أو وصف المسار</label>
              <input
                type="text"
                value={currentEdit.instituteSubtitle || ''}
                onChange={(e) => setCurrentEdit({ ...currentEdit, instituteSubtitle: e.target.value })}
                placeholder="مثال: مسار التجويد التطبيقي والدراية الإسنادية - الشعبة الأكاديمية"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-2.5 text-slate-100 outline-none"
              />
            </div>

            {/* Custom Welcome Message */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-300 font-bold">رسالة الترحيب لطلاب هذه المجموعة</label>
              <textarea
                rows={2}
                value={currentEdit.welcomeMessage || ''}
                onChange={(e) => setCurrentEdit({ ...currentEdit, welcomeMessage: e.target.value })}
                placeholder="رسالة ترحيبية تظهر في رأس المنصة لطلاب هذا المعهد..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-2.5 text-slate-100 outline-none"
              />
            </div>

            {/* Custom Bag Badge Text */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>نص الشارة الخاصة بالحقيبة التجويدية (Badge)</span>
                <span className="text-[10px] text-amber-400 font-normal">يظهر على غلاف الحقائب لطلاب هذا المعهد</span>
              </label>
              <input
                type="text"
                value={currentEdit.customBadgeText || ''}
                onChange={(e) => setCurrentEdit({ ...currentEdit, customBadgeText: e.target.value })}
                placeholder="مثال: معتمد لطلاب معهد الفرقان 🏛️"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-2.5 text-slate-100 outline-none"
              />
            </div>

            {/* Color Palette Preset Picker */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>لوحة الألوان المعتمدة للمعهد (Color Palette):</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availablePresets.map((p) => {
                  const isChecked = currentEdit.themePreset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setCurrentEdit({ ...currentEdit, themePreset: p.key })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400 text-white font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate">{p.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-400 mr-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo Selection: Icon Insignia vs Image URL */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>شعار المعهد (أيقونة مميزة أو رابط صورة مباشر):</span>
              </label>

              {/* Icons Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {logoIcons.map((ic) => {
                  const isChecked = currentEdit.logoIcon === ic.key;
                  return (
                    <button
                      key={ic.key}
                      type="button"
                      onClick={() => setCurrentEdit({ ...currentEdit, logoIcon: ic.key })}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {ic.icon}
                      <span className="truncate text-[10px]">{ic.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Image URL */}
              <div className="pt-1">
                <input
                  type="url"
                  value={currentEdit.logoUrl || ''}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, logoUrl: e.target.value })}
                  placeholder="أو رابط شعار المعهد كصورة: https://... (PNG أو SVG أو JPG)"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-2 text-slate-100 text-xs dir-ltr font-mono outline-none"
                />
              </div>
            </div>

          </div>

          {/* Interactive Live Student Mockup Preview */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-amber-300 font-quran flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              معاينة فورية لتجربة الطالب بهذا المعهد (Live Mockup):
            </span>

            {/* Live Card Mockup */}
            <div className={`p-4 rounded-2xl border ${presetDetails.cardBorder} shadow-lg space-y-3 bg-gradient-to-r ${presetDetails.bannerGradient} transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden"
                    style={{ backgroundColor: presetDetails.primaryColor }}
                  >
                    {currentEdit.logoUrl ? (
                      <img src={currentEdit.logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Landmark className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold font-quran block">
                      {currentEdit.instituteName || 'اسم المعهد المخصص'}
                    </span>
                    <h5 className="text-xs font-bold text-white font-quran">
                      {currentEdit.groupName || 'اسم المجموعة الطلابية'}
                    </h5>
                  </div>
                </div>

                {currentEdit.customBadgeText && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${presetDetails.badgeBg}`}>
                    {currentEdit.customBadgeText}
                  </span>
                )}
              </div>

              {currentEdit.welcomeMessage && (
                <p className="text-[11px] text-slate-200/90 bg-black/30 p-2 rounded-xl leading-relaxed">
                  💬 {currentEdit.welcomeMessage}
                </p>
              )}
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-quran px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات المعهد والمجموعة 💾</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
