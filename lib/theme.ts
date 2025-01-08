export const getThemeClasses = (colorScheme: string) => {
  const classes = {
    blue: {
      primary: 'bg-blue-600/50',
      hover: 'hover:bg-blue-700/30',
      active: 'bg-blue-700/30',
      text: 'text-blue-50',
      border: 'border-blue-200/20',
      muted: 'text-blue-50/70'
    },
    green: {
      primary: 'bg-green-600/50',
      hover: 'hover:bg-green-700/30',
      active: 'bg-green-700/30',
      text: 'text-green-50',
      border: 'border-green-200/20',
      muted: 'text-green-50/70'
    },
    purple: {
      primary: 'bg-purple-600/50',
      hover: 'hover:bg-purple-700/30',
      active: 'bg-purple-700/30',
      text: 'text-purple-50',
      border: 'border-purple-200/20',
      muted: 'text-purple-50/70'
    },
    orange: {
      primary: 'bg-orange-600/50',
      hover: 'hover:bg-orange-700/30',
      active: 'bg-orange-700/30',
      text: 'text-orange-50',
      border: 'border-orange-200/20',
      muted: 'text-orange-50/70'
    },
    pink: {
      primary: 'bg-pink-600/50',
      hover: 'hover:bg-pink-700/30',
      active: 'bg-pink-700/30',
      text: 'text-pink-50',
      border: 'border-pink-200/20',
      muted: 'text-pink-50/70'
    }
  }

  return classes[colorScheme as keyof typeof classes]
} 