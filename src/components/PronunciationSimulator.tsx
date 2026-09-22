import React, { useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, CheckCircle2, Play, Pause } from 'lucide-react';

interface PronunciationSimulatorProps {
  phrase: string;
  correctText: string;
  incorrectText: string;
  guide: string;
  mistake: string;
}

export const PronunciationSimulator: React.FC<PronunciationSimulatorProps> = ({
  phrase,
  correctText,
  incorrectText,
  guide,
  mistake
}) => {
  const [isPlayingCorrect, setIsPlayingCorrect] = useState(false);
  const [isPlayingIncorrect, setIsPlayingIncorrect] = useState(false);

  const speakText = (text: string, isCorrect: boolean) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = isCorrect ? 0.85 : 0.95; // slightly slower for tajweed precision

      if (isCorrect) {
        setIsPlayingCorrect(true);
        utterance.onend = () => setIsPlayingCorrect(false);
        utterance.onerror = () => setIsPlayingCorrect(false);
      } else {
        setIsPlayingIncorrect(true);
        utterance.onend = () => setIsPlayingIncorrect(false);
        utterance.onerror = () => setIsPlayingIncorrect(false);
      }

      window.speechSynthesis.speak(utterance);
    } else {
      alert("خاصية نطق الصوت غير مدعومة في متصفحك حالياً");
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingCorrect(false);
      setIsPlayingIncorrect(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl my-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
          <Volume2 className="w-5 h-5" />
          <span>محاكي النطق الصوتي المقارن: <span className="font-quran text-lg text-amber-300">{phrase}</span></span>
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full">
          تطبيق أداء محاكاة
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Correct Pronunciation Card */}
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>الأداء الصحيح (وفق حفص):</span>
            </div>
            <p className="font-quran text-xl text-emerald-200 mb-2 font-bold tracking-wide">
              {correctText}
            </p>
            <p className="text-xs text-emerald-300/80 leading-relaxed mb-3">
              {guide}
            </p>
          </div>

          <button
            onClick={() => isPlayingCorrect ? stopAudio() : speakText(correctText, true)}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {isPlayingCorrect ? (
              <>
                <Pause className="w-4 h-4 animate-pulse" />
                <span>إيقاف النطق الصحيح</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>استماع للأداء الصحيح</span>
              </>
            )}
          </button>
        </div>

        {/* Incorrect Pronunciation Card */}
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>الخطأ الشائع (محذَّر منه):</span>
            </div>
            <p className="font-quran text-xl text-rose-300 mb-2 font-bold tracking-wide">
              {incorrectText}
            </p>
            <p className="text-xs text-rose-300/80 leading-relaxed mb-3">
              {mistake}
            </p>
          </div>

          <button
            onClick={() => isPlayingIncorrect ? stopAudio() : speakText(incorrectText, false)}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-bold py-2.5 px-4 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer border border-rose-700/50"
          >
            {isPlayingIncorrect ? (
              <>
                <VolumeX className="w-4 h-4 animate-pulse" />
                <span>إيقاف صوت الخطأ</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>استماع للخطأ الشائع (للتجنب)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
