/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { theme } from 'antd';
import type { ConfigProviderProps } from 'antd';

import { useLayout } from '../components/layout/LayoutContext';

const clsx = (...parts: Array<unknown>) =>
  parts
    .flatMap((part) => {
      if (!part) return [];
      if (Array.isArray(part)) return part;
      if (typeof part === 'string') return [part];
      return [];
    })
    .filter(Boolean)
    .join(' ');

const STYLE_TAG_ID = 'atlas-bootstrap-theme';

type DesignToken = ReturnType<typeof theme.getDesignToken>;

const px = (value: unknown, fallback: number) => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? `${numberValue}px` : `${fallback}px`;
};

const ensureStyleTag = () => {
  if (typeof document === 'undefined') return null;

  const existing = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (existing) return existing;

  const style = document.createElement('style');
  style.id = STYLE_TAG_ID;
  document.head.appendChild(style);
  return style;
};

const buildCss = (token: DesignToken) => {
  const lineWidth = px((token as any).lineWidth, 1);
  const lineType = (token as any).lineType || 'solid';
  const colorBorder = (token as any).colorBorder || '#d9d9d9';
  const colorSplit = (token as any).colorSplit || colorBorder;
  const colorInfoText = (token as any).colorInfoText || (token as any).colorInfo || '#3a87ad';
  const borderRadiusLG = px((token as any).borderRadiusLG, 6);
  const borderRadiusSM = px((token as any).borderRadiusSM, 4);
  const padding = px((token as any).padding, 12);
  const paddingLG = px((token as any).paddingLG, 16);
  const paddingXXS = px((token as any).paddingXXS, 4);
  const colorBgContainer = (token as any).colorBgContainer || '#fff';
  const colorBgContainerDisabled = (token as any).colorBgContainerDisabled || '#f5f5f5';
  const colorPrimary = (token as any).colorPrimary || '#1890ff';
  const colorPrimaryHover = (token as any).colorPrimaryHover || colorPrimary;
  const colorTextLightSolid = (token as any).colorTextLightSolid || '#fff';
  const colorText = (token as any).colorText || 'rgba(0,0,0,.88)';

  return `
    .atlas-bs-boxBorder{border:${lineWidth} ${lineType} color-mix(in srgb, ${colorBorder} 80%, #000);}
    .atlas-bs-alertRoot{color:${colorInfoText};text-shadow:0 1px 0 rgba(255,255,255,.8);}

    .atlas-bs-modalContainer{padding:0;border-radius:${borderRadiusLG};}
    .atlas-bs-modalHeader{border-bottom:${lineWidth} ${lineType} ${colorSplit};padding:${padding} ${paddingLG};}
    .atlas-bs-modalBody{padding:${padding} ${paddingLG};}
    .atlas-bs-modalFooter{border-top:${lineWidth} ${lineType} ${colorSplit};padding:${padding} ${paddingLG};background-color:${colorBgContainerDisabled};box-shadow:inset 0 1px 0 ${colorBgContainer};}

    .atlas-bs-buttonRoot{background-image:linear-gradient(to bottom, transparent, rgba(0,0,0,.2));box-shadow:inset 0 1px 0 rgba(255,255,255,.15);transition:none;border-color:rgba(0,0,0,.3);text-shadow:0 -1px 0 rgba(0,0,0,.2);}
    .atlas-bs-buttonRoot:hover,.atlas-bs-buttonRoot:active{background-image:linear-gradient(rgba(0,0,0,.15) 100%);}
    .atlas-bs-buttonRoot:active{box-shadow:inset 0 1px 3px rgba(0,0,0,.15);}
    .atlas-bs-buttonColorDefault{text-shadow:none;color:${colorText};border-bottom-color:rgba(0,0,0,.5);}

	    .atlas-bs-popupBox{border-radius:${borderRadiusLG};background-color:${colorBgContainer};}
	    .atlas-bs-popupBox ul{padding-inline:0;}

	    /* Dropdown / Select overlays (portal) */
	    .ant-dropdown, .ant-select-dropdown, .ant-color-picker-panel, .ant-popover .ant-popover-inner{
	      border-radius:${borderRadiusLG};
	      background-color:${colorBgContainer};
	      border:${lineWidth} ${lineType} color-mix(in srgb, ${colorBorder} 80%, #000);
	    }
	    .ant-dropdown .ant-dropdown-menu, .ant-select-dropdown .ant-select-dropdown-menu{padding-inline:0;}
	    .ant-dropdown .ant-dropdown-menu-item, .ant-dropdown .ant-dropdown-menu-submenu-title,
	    .ant-select-dropdown .ant-select-item{
	      border-radius:0;
	      transition:none;
	      padding-block:${paddingXXS};
	      padding-inline:${padding};
	    }
	    .ant-dropdown .ant-dropdown-menu-item:hover, .ant-dropdown .ant-dropdown-menu-item:active, .ant-dropdown .ant-dropdown-menu-item:focus,
	    .ant-select-dropdown .ant-select-item:hover, .ant-select-dropdown .ant-select-item:active, .ant-select-dropdown .ant-select-item:focus,
	    .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled){
	      background-image:linear-gradient(to bottom, ${colorPrimaryHover}, ${colorPrimary});
	      color:${colorTextLightSolid};
	    }
	    .atlas-bs-switchRoot{box-shadow:inset 0 1px 3px rgba(0,0,0,.4);}
	
	    .atlas-bs-progressTrack{background-image:linear-gradient(to bottom, ${colorPrimaryHover}, ${colorPrimary});border-radius:${borderRadiusSM};}
	    .atlas-bs-progressRail{border-radius:${borderRadiusSM};}
	    .atlas-bs-progress .ant-progress-inner{border-radius:${borderRadiusSM};}
	    .atlas-bs-progress .ant-progress-bg{background-image:linear-gradient(to bottom, ${colorPrimaryHover}, ${colorPrimary}) !important;}
	  `.trim();
};

const useBootstrapTheme = (): ConfigProviderProps => {
  const { isDarkMode } = useLayout();

  const algorithm = isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm;

  const themeConfig = useMemo<NonNullable<ConfigProviderProps['theme']>>(
    () => ({
      algorithm,
      token: {
        borderRadius: 4,
        borderRadiusLG: 6,
        colorInfo: '#3a87ad',
        colorPrimary: '#A67458',
        colorPrimaryHover: '#B48368',
        colorPrimaryActive: '#8B5E47',
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      },
      components: {
        Tooltip: {
          fontSize: 12,
        },
        Checkbox: {
          colorBorder: '#666',
          borderRadius: 2,
          algorithm: true,
        },
        Radio: {
          colorBorder: '#666',
          borderRadius: 2,
          algorithm: true,
        },
        Modal: {
          contentBg: isDarkMode ? '#141B2D' : '#ffffff',
          headerBg: isDarkMode ? '#141B2D' : '#ffffff',
          titleColor: isDarkMode ? '#ffffff' : '#000000',
        },
        Table: {
          headerBg: isDarkMode ? '#1c2536' : '#FFFFFF',
          headerColor: isDarkMode ? '#FFFFFF' : '#1E293B',
          colorBgContainer: isDarkMode ? '#0A0F1C' : '#FAFBFC',
          colorText: isDarkMode ? '#E2E8F0' : '#334155',
          rowHoverBg: isDarkMode ? '#1e293b' : '#F8FAFC',
        },
        Button: {
          colorPrimary: '#A67458',
        },
        Select: {
          selectorBg: isDarkMode ? '#171C2A' : '#ffffff',
          optionSelectedBg: isDarkMode ? '#1e293b' : '#e6f4ff',
          colorBgElevated: isDarkMode ? '#171C2A' : '#ffffff',
          colorBorder: isDarkMode ? '#1E2A47' : '#CBD5E1',
        },
      },
    }),
    [algorithm, isDarkMode],
  );

  const cssText = useMemo(() => {
    const designToken = theme.getDesignToken(themeConfig as any);
    return buildCss(designToken);
  }, [themeConfig]);

  useEffect(() => {
    const style = ensureStyleTag();
    if (!style) return;
    style.textContent = cssText;
  }, [cssText]);

  return useMemo<ConfigProviderProps>(
    () => ({
      theme: themeConfig,
      wave: {
        showEffect: () => {},
      },
      modal: {
        classNames: {
          container: clsx('atlas-bs-boxBorder', 'atlas-bs-modalContainer'),
          header: 'atlas-bs-modalHeader',
          body: 'atlas-bs-modalBody',
          footer: 'atlas-bs-modalFooter',
        },
      },
      button: {
        classNames: ({ props }: any) => ({
          root: clsx('atlas-bs-buttonRoot', props?.color === 'default' && 'atlas-bs-buttonColorDefault'),
        }),
      },
	      alert: {
	        className: 'atlas-bs-alertRoot',
	      },
	      switch: {
	        className: 'atlas-bs-switchRoot',
	      },
	      progress: {
	        className: 'atlas-bs-progress',
	      },
	    }),
	    [themeConfig],
	  );
};

export default useBootstrapTheme;
