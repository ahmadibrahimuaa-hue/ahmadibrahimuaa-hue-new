import React from 'react';
import { Book, Crown, Landmark, Award, Sparkles, GraduationCap, ShieldCheck, Star } from 'lucide-react';
import { GroupThemeConfig } from '../types';

interface InstituteLogoProps {
  theme?: GroupThemeConfig | null;
  className?: string;
  iconClassName?: string;
  fallbackIcon?: string;
}

export const InstituteLogo: React.FC<InstituteLogoProps> = ({
  theme,
  className = 'w-10 h-10',
  iconClassName = 'w-6 h-6',
  fallbackIcon = 'landmark',
}) => {
  if (theme?.logoUrl && theme.logoUrl.trim()) {
    return (
      <img
        src={theme.logoUrl.trim()}
        alt={theme.instituteName || 'شعار المعهد'}
        className={`${className} object-contain rounded-xl drop-shadow-md`}
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  const iconKey = theme?.logoIcon || fallbackIcon;

  switch (iconKey) {
    case 'quran':
      return <Book className={iconClassName} />;
    case 'crown':
      return <Crown className={iconClassName} />;
    case 'award':
      return <Award className={iconClassName} />;
    case 'sparkles':
      return <Sparkles className={iconClassName} />;
    case 'graduation-cap':
      return <GraduationCap className={iconClassName} />;
    case 'shield':
      return <ShieldCheck className={iconClassName} />;
    case 'star':
      return <Star className={iconClassName} />;
    case 'landmark':
    default:
      return <Landmark className={iconClassName} />;
  }
};
