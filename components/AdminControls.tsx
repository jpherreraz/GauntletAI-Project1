'use client'

import { Button } from '@/components/ui/button'

export function AdminControls() {
  const handleClearMessages = async () => {
    try {
      const response = await fetch('/api/clear-messages', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear messages');
      }

      // Optionally refresh the page or update the message list
      window.location.reload();
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleClearMessages}
      className="mt-4"
    >
      Clear All Messages
    </Button>
  );
} 