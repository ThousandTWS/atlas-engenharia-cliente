/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export type SidebarProfile = 'android' | 'ios' | 'tablet' | 'tv' | 'corporate';

interface SidebarProfileDimensions {
  expanded: number;
  collapsed: number;
  drawer: number;
}

const SIDEBAR_DIMENSIONS: Record<SidebarProfile, SidebarProfileDimensions> = {
  android: { expanded: 0, collapsed: 0, drawer: 300 },
  ios: { expanded: 0, collapsed: 0, drawer: 320 },
  tablet: { expanded: 256, collapsed: 88, drawer: 0 },
  tv: { expanded: 360, collapsed: 128, drawer: 0 },
  corporate: { expanded: 288, collapsed: 92, drawer: 0 },
};

interface LayoutContextData {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  isMobile: boolean;
  sidebarProfile: SidebarProfile;
  sidebarDimensions: SidebarProfileDimensions;
  sideBarWidth: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LayoutContext = createContext<LayoutContextData | undefined>(undefined);

function detectSidebarProfile(isMobile: boolean, isTabletViewport: boolean, isTvViewport: boolean): SidebarProfile {
  if (isMobile) {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipod|ipad/.test(userAgent);
    return isIOSDevice ? 'ios' : 'android';
  }

  if (isTvViewport) {
    return 'tv';
  }

  if (isTabletViewport) {
    return 'tablet';
  }

  return 'corporate';
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTabletViewport = Boolean(screens.md) && !screens.xl;
  const isTvViewport = Boolean(screens.xxl);

  const sidebarProfile = useMemo(
    () => detectSidebarProfile(isMobile, isTabletViewport, isTvViewport),
    [isMobile, isTabletViewport, isTvViewport],
  );

  const sidebarDimensions = SIDEBAR_DIMENSIONS[sidebarProfile];

  const [isDarkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('prefers-color-scheme: dark').matches);
  });

  const toggleTheme = () => setDarkMode((previousMode) => !previousMode);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      return;
    }

    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, [isDarkMode]);

  const [collapsed, setCollapsed] = useState<boolean>(() => !window.matchMedia('(min-width: 768px)').matches);

  const isSidebarCollapsed = sidebarProfile === 'tv' ? false : collapsed;
  const sideBarWidth = isMobile ? 0 : (isSidebarCollapsed ? sidebarDimensions.collapsed : sidebarDimensions.expanded);

  return (
    <LayoutContext.Provider
      value={{
        collapsed: isSidebarCollapsed,
        setCollapsed,
        isMobile,
        sidebarProfile,
        sidebarDimensions,
        sideBarWidth,
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout deve ser usado dentro de LayoutProvider');
  }

  return context;
}
