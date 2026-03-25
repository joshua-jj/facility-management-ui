/**
 * Centralized color palette for EGFM Facility Management System.
 * All colors referenced across the app should come from here.
 */

export const lightPalette = {
   primary: {
      main: '#0F2552',
      light: '#1a3a7a',
      dark: '#0a1a3d',
      contrastText: '#ffffff',
   },
   secondary: {
      main: '#B28309',
      light: '#D4A84B',
      dark: '#9a7208',
      contrastText: '#ffffff',
   },
   error: {
      main: '#ef4444',
      light: '#fca5a5',
      bg: 'rgba(239, 68, 68, 0.08)',
   },
   success: {
      main: '#10b981',
      light: '#6ee7b7',
      bg: 'rgba(16, 185, 129, 0.08)',
   },
   warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      bg: 'rgba(245, 158, 11, 0.08)',
   },
   info: {
      main: '#3b82f6',
      light: '#93c5fd',
      bg: 'rgba(59, 130, 246, 0.08)',
   },
   background: {
      default: '#fafafa',
      paper: '#ffffff',
      subtle: 'rgba(15, 37, 82, 0.03)',
   },
   surface: {
      low: '#f9fafb',
      medium: '#f3f4f6',
      high: '#e5e7eb',
   },
   text: {
      primary: '#0F2552',
      secondary: 'rgba(15, 37, 82, 0.7)',
      disabled: 'rgba(15, 37, 82, 0.35)',
      hint: '#9ca3af',
   },
   border: {
      default: 'rgba(15, 37, 82, 0.06)',
      strong: 'rgba(15, 37, 82, 0.12)',
   },
   sidebar: {
      bg: '#0F2552',
      text: 'rgba(255, 255, 255, 0.6)',
      textActive: '#D4A84B',
      bgActive: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.1)',
   },
   header: {
      bg: '#ffffff',
      border: '#E1E3E7',
      shadow: '0px 16px 32px 0px rgba(189, 189, 189, 0.25)',
   },
};

export const darkPalette = {
   primary: {
      main: '#6B8FCC',
      light: '#93b5e8',
      dark: '#4a6da3',
      contrastText: '#ffffff',
   },
   secondary: {
      main: '#D4A84B',
      light: '#e8bc5f',
      dark: '#B28309',
      contrastText: '#ffffff',
   },
   error: {
      main: '#ef4444',
      light: '#fca5a5',
      bg: 'rgba(239, 68, 68, 0.15)',
   },
   success: {
      main: '#10b981',
      light: '#6ee7b7',
      bg: 'rgba(16, 185, 129, 0.15)',
   },
   warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      bg: 'rgba(245, 158, 11, 0.15)',
   },
   info: {
      main: '#3b82f6',
      light: '#93c5fd',
      bg: 'rgba(59, 130, 246, 0.15)',
   },
   background: {
      default: '#0e0e1a',
      paper: '#1a1a2e',
      subtle: 'rgba(255, 255, 255, 0.04)',
   },
   surface: {
      low: 'rgba(255, 255, 255, 0.03)',
      medium: 'rgba(255, 255, 255, 0.05)',
      high: 'rgba(255, 255, 255, 0.08)',
   },
   text: {
      primary: 'rgba(255, 255, 255, 0.9)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.25)',
      hint: 'rgba(255, 255, 255, 0.35)',
   },
   border: {
      default: 'rgba(255, 255, 255, 0.08)',
      strong: 'rgba(255, 255, 255, 0.15)',
   },
   sidebar: {
      bg: '#0F2552',
      text: 'rgba(255, 255, 255, 0.6)',
      textActive: '#D4A84B',
      bgActive: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.1)',
   },
   header: {
      bg: '#1a1a2e',
      border: 'rgba(255, 255, 255, 0.1)',
      shadow: 'none',
   },
};

export type Palette = typeof lightPalette;
