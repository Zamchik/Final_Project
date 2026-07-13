import type { ThemeConfig } from 'antd';
import { theme as antTheme } from 'antd';

export const themeConfig: ThemeConfig = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    colorPrimary: '#722ed1',
    borderRadius: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#141414',
      bodyBg: '#1f1f1f',
      footerBg: '#141414',
    },
    Menu: {
      darkItemBg: '#141414',
      darkItemSelectedBg: '#722ed1',
    },
    Card: {
      colorBgContainer: '#2a2a2a',
    },
    Table: {
      headerBg: '#2a2a2a',
      rowHoverBg: '#333',
    },
  },
};