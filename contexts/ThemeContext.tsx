'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'system'
type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'pink'

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  setTheme: (theme: Theme) => void
  setColorScheme: (colorScheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark')
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-theme', colorScheme)
  }, [theme, colorScheme])

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

