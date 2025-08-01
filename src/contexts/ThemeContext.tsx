import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme, getGradient, getColor, getModalConfig, getDropdownConfig, getSettingsConfig } from '../config/themeConfig';

type Theme = 'light' | 'dark' | 'bright' | 'auto' | 'dark-gradient' | 'white-purple-gradient';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  isDarkMode: boolean;
  isBrightMode: boolean;
  isDarkGradient: boolean;
  isWhitePurpleGradient: boolean;
  // Theme configuration helpers
  getThemeConfig: (componentType: 'features' | 'videos' | 'footer' | 'hero' | 'modals' | 'dropdowns' | 'settings') => any;
  getThemeGradient: (gradientName: string) => string;
  getThemeColor: (colorName: string) => string;
  getModalTheme: () => any;
  getDropdownTheme: () => any;
  getSettingsTheme: () => any;
  // Accessibility features
  fontSize: string;
  setFontSize: (size: string) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  screenReader: boolean;
  setScreenReader: (enabled: boolean) => void;
  keyboardNavigation: boolean;
  setKeyboardNavigation: (enabled: boolean) => void;
  focusIndicators: boolean;
  setFocusIndicators: (enabled: boolean) => void;
  colorBlindMode: string;
  setColorBlindMode: (mode: string) => void;
  textSpacing: string;
  setTextSpacing: (spacing: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or default to auto
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'auto';
  });
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  // Existing accessibility state
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [focusIndicators, setFocusIndicators] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState('none');
  const [textSpacing, setTextSpacing] = useState('normal');

  // Determine if we're in dark mode based on theme and system preference
  const isDarkMode = theme === 'dark' || (theme === 'auto' && (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const isBrightMode = theme === 'bright';
  const isDarkGradient = theme === 'dark-gradient';
  const isWhitePurpleGradient = theme === 'white-purple-gradient';

  // Get current theme mode for configuration (light or dark)
  const currentThemeMode = isDarkMode ? 'dark' : 'light';

  // Theme configuration helper functions
  const getThemeConfig = (componentType: 'features' | 'videos' | 'footer' | 'hero' | 'modals' | 'dropdowns' | 'settings') => {
    return applyTheme(currentThemeMode, componentType);
  };

  const getThemeGradient = (gradientName: string) => {
    return getGradient(gradientName as any, currentThemeMode);
  };

  const getThemeColor = (colorName: string) => {
    return getColor(colorName as any, currentThemeMode);
  };

  const getModalTheme = () => {
    return getModalConfig(currentThemeMode);
  };

  const getDropdownTheme = () => {
    return getDropdownConfig(currentThemeMode);
  };

  const getSettingsTheme = () => {
    return getSettingsConfig(currentThemeMode);
  };

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-bright', 'theme-dark-gradient', 'theme-white-purple-gradient');
    
    // Add current theme class
    if (isWhitePurpleGradient) {
      root.classList.add('theme-white-purple-gradient');
      root.setAttribute('data-theme', 'white-purple-gradient');
      root.classList.remove('dark');
    } else if (isDarkGradient) {
      root.classList.add('theme-dark-gradient');
      root.setAttribute('data-theme', 'dark-gradient');
      root.classList.add('dark');
    } else if (isBrightMode) {
      root.classList.add('theme-bright');
      root.setAttribute('data-theme', 'bright');
      root.classList.remove('dark');
    } else if (isDarkMode) {
      root.classList.add('theme-dark');
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.classList.add('theme-light');
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
    }

    // Mark as initialized after first render
    if (!isInitialized) {
      setIsInitialized(true);
    }

    // Mark as hydrated after theme is applied
    if (!isHydrated) {
      setIsHydrated(true);
    }

    // Apply animation preferences
    if (!animationsEnabled) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }

    // Apply accessibility features
    // Font size
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large');
    root.classList.add(`font-size-${fontSize}`);

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Focus indicators
    if (focusIndicators) {
      root.classList.add('focus-indicators');
    } else {
      root.classList.remove('focus-indicators');
    }

    // Keyboard navigation
    if (keyboardNavigation) {
      root.classList.add('keyboard-nav');
    } else {
      root.classList.remove('keyboard-nav');
    }

    // Color blind mode
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${colorBlindMode}`);
    }

    // Text spacing
    root.classList.remove('text-spacing-increased', 'text-spacing-extra');
    if (textSpacing !== 'normal') {
      root.classList.add(`text-spacing-${textSpacing}`);
    }
  }, [theme, animationsEnabled, isDarkMode, isBrightMode, isDarkGradient, isWhitePurpleGradient, fontSize, highContrast, reducedMotion, focusIndicators, keyboardNavigation, colorBlindMode, textSpacing]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Trigger re-render by updating state
        setTheme('auto');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Create a wrapped setTheme that also persists to localStorage
  const setThemeWithPersistence = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const value = {
    theme,
    setTheme: setThemeWithPersistence,
    animationsEnabled,
    setAnimationsEnabled,
    isDarkMode,
    isBrightMode,
    isDarkGradient,
    isWhitePurpleGradient,
    // Theme configuration helpers
    getThemeConfig,
    getThemeGradient,
    getThemeColor,
    getModalTheme,
    getDropdownTheme,
    getSettingsTheme,
    // Accessibility features
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    screenReader,
    setScreenReader,
    keyboardNavigation,
    setKeyboardNavigation,
    focusIndicators,
    setFocusIndicators,
    colorBlindMode,
    setColorBlindMode,
    textSpacing,
    setTextSpacing,
  };

  // Don't render children until theme is hydrated to prevent flash
  if (!isHydrated) {
    return (
      <ThemeContext.Provider value={value}>
        <div style={{ visibility: 'hidden' }}>
          {children}
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 