'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette, Check, Monitor, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

const themes = [
  {
    name: 'Professional Blue',
    value: 'professional-blue',
    description: 'Classic blue theme for legal professionals',
    colors: {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(210, 40%, 96%)',
      accent: 'hsl(210, 40%, 96%)',
    }
  },
  {
    name: 'Legal Gray',
    value: 'legal-gray',
    description: 'Professional gray theme',
    colors: {
      primary: 'hsl(215, 14%, 34%)',
      secondary: 'hsl(210, 40%, 98%)',
      accent: 'hsl(210, 40%, 96%)',
    }
  },
  {
    name: 'Modern Purple',
    value: 'modern-purple',
    description: 'Modern purple accent theme',
    colors: {
      primary: 'hsl(262, 83%, 58%)',
      secondary: 'hsl(210, 40%, 96%)',
      accent: 'hsl(210, 40%, 96%)',
    }
  },
  {
    name: 'Classic Slate',
    value: 'classic-slate',
    description: 'Clean slate theme',
    colors: {
      primary: 'hsl(215, 25%, 27%)',
      secondary: 'hsl(210, 40%, 98%)',
      accent: 'hsl(210, 40%, 96%)',
    }
  }
]

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('professional-blue')

  useEffect(() => {
    setMounted(true)
    // Get theme from localStorage or default to professional-blue
    const savedTheme = localStorage.getItem('theme-preset') || 'professional-blue'
    setSelectedTheme(savedTheme)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="min-h-[44px]">
        <Palette className="h-4 w-4" />
      </Button>
    )
  }

  const handleThemeChange = (themeValue: string) => {
    setSelectedTheme(themeValue)
    localStorage.setItem('theme-preset', themeValue)
    
    // Apply theme colors to CSS variables
    const themeConfig = themes.find(t => t.value === themeValue)
    if (themeConfig) {
      const root = document.documentElement
      root.style.setProperty('--primary', themeConfig.colors.primary)
      root.style.setProperty('--secondary', themeConfig.colors.secondary)
      root.style.setProperty('--accent', themeConfig.colors.accent)
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Theme Mode Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
        className="min-h-[44px]"
      >
        {getThemeIcon()}
      </Button>

      {/* Theme Preset Picker */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 min-h-[44px]"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {themes.map((themeOption) => (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: themeOption.colors.primary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: themeOption.colors.secondary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: themeOption.colors.accent }}
                  />
                </div>
                <div>
                  <div className="font-medium">{themeOption.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {themeOption.description}
                  </div>
                </div>
              </div>
              {selectedTheme === themeOption.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
