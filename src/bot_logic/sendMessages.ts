import { User } from '../user_logic/fetchValidGoogleSheetUsers';
import TelegramBot from 'node-telegram-bot-api';

// Function to send the contract address to all user IDs
export const sendContractAddress = async (
  contractAddress: string,
  users: User[],
  ronBot: TelegramBot
) => {
  for (const user of users) {
    try {
      console.log(user.uid);
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
