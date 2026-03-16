/**
 * EGFM Facility Management System — Centralized Theme Configuration
 *
 * Usage:
 *   import { lightPalette, darkPalette, typography, shadows, radii } from '@/theme';
 *
 * This project uses Tailwind CSS v4 with class-based dark mode.
 * CSS custom properties are set in globals.css.
 * This module provides the single source of truth for all design tokens
 * so that component-level Tailwind classes stay consistent.
 */

export { lightPalette, darkPalette } from './palette';
export type { Palette } from './palette';
export { typography } from './typography';
export { shadows, darkShadows } from './shadows';
export { spacing, radii, breakpoints } from './spacing';
