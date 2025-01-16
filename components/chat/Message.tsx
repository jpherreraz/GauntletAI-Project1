import { FC } from 'react';
import { Message as MessageType } from '@/src/types/message';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Reply, ChevronDown, ChevronRight, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmojiPicker } from '@/components/EmojiPicker';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { formatMessageTime, formatDate } from '@/lib/utils';

interface MessageProps {
  message: MessageType;
  isReply?: boolean;
  onReplyClick?: (message: MessageType) => void;
  hasReplies?: boolean;
  isExpanded?: boolean;
  onToggleReplies?: () => void;
  replies?: MessageType[];
  prevMessage?: MessageType;
  onReactionSelect?: (messageId: string, emoji: string) => void;
  userId?: string;
}

export const Message: FC<MessageProps> = ({
  message,
  isReply = false,
  onReplyClick,
  hasReplies,
  isExpanded,
  onToggleReplies,
  replies,
  prevMessage,
  onReactionSelect,
  userId
}) => {
  const { colorScheme } = useTheme();
  const shouldChainMessage = (current: MessageType, prev?: MessageType) => {
    if (!prev) return false;
    const timeDiff = current.timestamp - prev.timestamp;
    const isWithinTimeWindow = timeDiff < 5 * 60 * 1000;
    return prev.userId === current.userId && isWithinTimeWindow;
  };

  const isChained = shouldChainMessage(message, prevMessage);

  return (
    <>
      <div className={cn(
        "relative",
        isReply && "ml-8",
        !isChained && "mt-2"
      )}>
        <div className="flex items-start gap-3 group">
          {!isChained && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.imageUrl} alt={message.fullName} />
              <AvatarFallback>
                {message.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className={`flex-1 ${isChained ? 'ml-11' : ''}`}>
            {!isChained && (
              <div className="flex items-baseline">
                <span className="text-white font-medium">{message.fullName}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {formatMessageTime(message.timestamp)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                "bg-gray-800"
              )}>
                <div className="text-gray-300">{message.text}</div>
                
                {message.reactions && Object.entries(message.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      users.length > 0 && (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 px-2 py-1 text-xs rounded-full",
                            "bg-gray-700/50",
                            users.includes(userId || '') && [
                              "border border-blue-400/50",
                              "text-blue-400"
                            ]
                          )}
                          onClick={() => onReactionSelect?.(message.id, emoji)}
                        >
                          {emoji} {users.length}
                        </Button>
                      )
                    ))}
                  </div>
                )}

                {hasReplies && !isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 h-5 px-1.5"
                    onClick={onToggleReplies}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Hide replies
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        Show replies ({replies?.length})
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <SmilePlus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[288px] p-0" align="start" side="top">
                    <EmojiPicker onEmojiSelect={(emoji) => onReactionSelect?.(message.id, emoji)} />
                  </PopoverContent>
                </Popover>
                {onReplyClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onReplyClick(message)}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasReplies && !isReply && isExpanded && (
        <div className="mt-2 ml-11">
          <div className="space-y-0">
            {replies?.map((reply, index) => (
              <Message 
                key={reply.id}
                message={reply}
                isReply={true}
                prevMessage={replies[index - 1]}
                onReactionSelect={onReactionSelect}
                userId={userId}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}; 