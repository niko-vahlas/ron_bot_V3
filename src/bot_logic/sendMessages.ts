import { User } from '../user_logic/fetchValidGoogleSheetUsers';
import TelegramBot from 'node-telegram-bot-api';

// Function to send the contract address to all user IDs
export const sendContractAddress = async (
  contractAddress: string,
  users: User[]
) => {
  const ronBotToken = process.env.BOTTOKEN;
  if (!ronBotToken) {
    console.log('invalid bot token');
    return;
  }
  const ronBot = new TelegramBot(ronBotToken, { polling: false });
  for (const user of users) {
    try {
      await ronBot.sendMessage(
        user.uid,
        `Hello! The current contract address is: ${contractAddress}`
      );
      console.log(`Message sent to user: ${user.uid}`);
    } catch (error: any) {
      console.error(
        `Failed to send message to user: ${user.uid}`,
        error.message
      );
    }
  }
};
