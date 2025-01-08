'use client'

import { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from '@/contexts/ThemeContext'

type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'pink'

const colorSchemes: Record<ColorScheme, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
}

export function AppearanceSettings() {
  const { colorScheme, setColorScheme } = useTheme()

  const handleColorSchemeChange = (newColorScheme: ColorScheme) => {
    setColorScheme(newColorScheme)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-4">Appearance</h3>
      <div className="space-y-8">
        <div>
          <Label htmlFor="colorScheme" className="text-sm font-medium block mb-2">
            Color Scheme
          </Label>
          <RadioGroup
            id="colorScheme"
            value={colorScheme}
            onValueChange={(value: ColorScheme) => handleColorSchemeChange(value)}
            className="grid grid-cols-5 gap-4"
          >
            {Object.entries(colorSchemes).map(([name, bgClass]) => (
              <div key={name}>
                <RadioGroupItem
                  value={name}
                  id={name}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={name}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className={`w-10 h-10 rounded-full ${bgClass}`} />
                  <span className="mt-2 capitalize">{name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}

