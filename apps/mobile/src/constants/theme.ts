/**
 * Paleta del prototipo (prototipo/portal-pdp.html): verde bosque sobre grises verdosos,
 * ocre solo para "pendiente/nuevo". Modo claro y oscuro.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#12201D',
    textSecondary: '#586A65',
    background: '#FFFFFF',
    backgroundElement: '#F4F7F6',
    backgroundSelected: '#EDF1EF',
    line: '#D6DEDB',
    brand: '#0E5A4F',
    brandInk: '#FFFFFF',
    brandSoft: '#DCEBE7',
    accent: '#9A6410',
    accentSoft: '#F6E8CC',
    ok: '#2A7A4B',
    danger: '#A93A2E',
  },
  dark: {
    text: '#E6EFEC',
    textSecondary: '#93A8A1',
    background: '#0C1412',
    backgroundElement: '#142320',
    backgroundSelected: '#1A2C28',
    line: '#27393A',
    brand: '#46B9A2',
    brandInk: '#04211C',
    brandSoft: '#173B35',
    accent: '#E3B04E',
    accentSoft: '#3A2D12',
    ok: '#5CC28A',
    danger: '#E5857A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
