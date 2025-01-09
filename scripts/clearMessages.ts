import { messageService } from "../src/services/messageService";

async function clearAllMessages() {
  try {
    console.log('Starting to clear messages...');
    await messageService.clearMessages();
    console.log('Successfully cleared all messages!');
  } catch (error) {
    console.error('Failed to clear messages:', error);
  } finally {
    process.exit();
  }
}

clearAllMessages(); 