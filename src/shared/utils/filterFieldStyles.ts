import type { CSSProperties } from 'react';

export const getFilterCardStyle = (isDarkMode: boolean): CSSProperties => ({
  marginBottom: 24,
  borderRadius: 8,
  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
  border: isDarkMode ? 'solid 1px #1E2A47' : '1px solid #CBD5E1',
});

export const getFilterControlStyle = (isDarkMode: boolean, width?: CSSProperties['width']): CSSProperties => ({
  ...(width ? { width } : {}),
  padding: '7px',
  background: isDarkMode ? '#171C2A' : '#fff',
  border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1',
});

export const getFilterSecondaryButtonStyle = (isDarkMode: boolean): CSSProperties => ({
  background: isDarkMode ? '#171C2A' : '#fff',
});
