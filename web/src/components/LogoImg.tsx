import React from 'react';
import { useTheme } from '@/hooks/useTheme';

export const LogoImg = ({ className = '' }: { className?: string }) => {
  const { theme } = useTheme();
  const src = theme === 'dark' ? '/logo_white.png' : '/logo_black.png';
  return <img src={src} alt="Logo" className={className} />;
};