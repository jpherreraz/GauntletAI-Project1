import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StickyNote, Bot } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { dmListService } from '@/src/services/dmListService';

const AVAILABLE_BOTS = [
  {
    id: 'chatgenius-bot',
    name: 'ChatGenius Bot',
    description: 'Your AI assistant for all your questions and needs.',
    imageUrl: '/favicon.ico',
    status: 'online'
  },
  {
    id: 'notes-bot',
    name: 'Notes Bot',
    description: 'Keep track of your notes and important information.',
    imageUrl: '/notes-bot.svg',
    status: 'online'
  },
  {
    id: 'gollum-bot',
    name: 'Gollum Bot',
    description: 'My precious! We helps you with riddles and secrets, yes precious!',
    imageUrl: '/gollum.jpg',
    status: 'online'
  },
  {
    id: 'yoda-bot',
    name: 'Yoda Bot',
    description: 'Help you I will. The Force, strong with this one, it is.',
    imageUrl: '/yoda.jpg',
    status: 'online'
  }
];

export function BotBrowser() {
  const router = useRouter();
  const { user } = useUser();
  const { colorScheme } = useTheme();

  const startChat = async (botId: string) => {
    if (!user) return;

    try {
      // Get bot's profile info
      const bot = AVAILABLE_BOTS.find(b => b.id === botId);
      if (!bot) return;

      // Create a custom event to trigger DM creation
      const event = new CustomEvent('startDM', {
        detail: {
          userId: botId,
          fullName: bot.name,
          imageUrl: bot.imageUrl,
          status: bot.status
        }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Error starting chat with bot:', error);
    }
  };

  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className={cn(
          "text-2xl font-bold mb-6",
          `text-${colorScheme}-50`
        )}>
          Available Bots
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_BOTS.map((bot) => (
            <div 
              key={bot.id}
              className={cn(
                "rounded-lg p-4 flex items-start space-x-4 transition-colors",
                `bg-${colorScheme}-600 bg-opacity-10`,
                `hover:bg-${colorScheme}-600 hover:bg-opacity-20`
              )}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={bot.imageUrl} />
                <AvatarFallback className={`bg-${colorScheme}-700 text-${colorScheme}-50`}>
                  {bot.id === 'notes-bot' ? (
                    <StickyNote className="h-6 w-6" />
                  ) : (
                    <Bot className="h-6 w-6" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold text-${colorScheme}-50`}>
                    {bot.name}
                  </h3>
                  <Button 
                    variant="ghost"
                    onClick={() => startChat(bot.id)}
                    className={cn(
                      "hover:bg-opacity-20",
                      `hover:bg-${colorScheme}-700`,
                      `text-${colorScheme}-50`
                    )}
                  >
                    Chat
                  </Button>
                </div>
                <p className={`text-${colorScheme}-50 text-opacity-70 mt-1`}>
                  {bot.description}
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <span className={`text-sm text-${colorScheme}-50 text-opacity-70 capitalize`}>
                    {bot.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 