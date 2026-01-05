/**
 * Design theme constants
 */

export const theme = {
  colors: {
    primary: '#2196f3',
    secondary: '#757575',
    success: '#4caf50',
    warning: '#ffa000',
    error: '#f44336',
    background: '#fafafa',
    surface: '#ffffff',
    border: '#e0e0e0',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd',
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },

  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 2px 8px rgba(0,0,0,0.12)',
    lg: '0 4px 16px rgba(0,0,0,0.12)',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu"',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
    },
  },
};

export type Theme = typeof theme;
