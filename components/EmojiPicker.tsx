import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { emojiCategories, categoryIcons } from '@/utils/emojiData'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const { colorScheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Smileys & Emotion')

  const filteredEmojis = searchQuery
    ? Object.values(emojiCategories)
        .flat()
        .filter(emoji => 
          emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emoji.emoji.includes(searchQuery)
        )
    : []

  return (
    <div className="p-2">
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      {!searchQuery && (
        <div className="flex mb-3 pt-0.5">
          {Object.entries(categoryIcons).map(([category, Icon]) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 flex-1 p-0",
                activeCategory === category
                  ? cn(
                      `bg-${colorScheme}-600`,
                      "bg-opacity-20"
                    )
                  : "hover:bg-muted"
              )}
              onClick={() => setActiveCategory(category)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
      <ScrollArea className="h-[300px]">
        <div className="relative">
          {searchQuery ? (
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onEmojiSelect(emoji.emoji)}
                >
                  {emoji.emoji}
                </Button>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0">
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <div
                  key={category}
                  className={cn(
                    "grid grid-cols-8 gap-1",
                    activeCategory === category ? "block" : "hidden"
                  )}
                >
                  {emojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onEmojiSelect(emoji.emoji)}
                    >
                      {emoji.emoji}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 