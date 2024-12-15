import { readFile } from 'fs/promises';
import { getContractAddress } from './notification_logic/getContractAddress.js';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import {
  fetchValidGoogleSheetUsers,
  User,
} from './user_logic/fetchValidGoogleSheetUsers.js';
import { sendContractAddress } from './bot_logic/sendMessages.js';
import { appendToCoinsSeen } from './write_coins_seen.js';
import TelegramBot from 'node-telegram-bot-api';
import { writeNewUser } from './user_logic/writeNewUser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
interface AddressesSeenJson {
  seenAddresses: string[];
}

async function main() {
  const filePath = path.resolve(__dirname, '../contract_addresses_seen.json');
  const fileContents = await readFile(filePath, 'utf8');
  const addressesSeenJson: AddressesSeenJson = JSON.parse(fileContents);
  const addressesSeen = new Set(addressesSeenJson.seenAddresses);
  dotenv.config();

  let users: User[] = [];
  const ronBotToken = process.env.BOTTOKEN;
  if (!ronBotToken) {
    console.log('invalid bot token');
    return;
  }
  const ronBot = new TelegramBot(ronBotToken, { polling: true });

  ronBot.on('message', (msg) => {
    if (!msg || !msg.from) {
      console.log("Message or 'from' property is undefined");
      return;
    }
    const userId = msg.from.id;
    const firstName = msg.from.username || null;
    const lastName = msg.from.last_name || null;
    let name = null;
    if (firstName && lastName) {
      name = `${firstName} ${lastName}`;
    }

    if (userId) {
      const user: User = {
        uid: String(userId),
        username: name,
        dateLastPaid: null,
        quantityLastSent: null,
      };
      writeNewUser(user);
    } else {
      console.log("Could not get user's id or username");
    }
  });

  cron.schedule('* * * * *', async () => {
    const tempUsers = await fetchValidGoogleSheetUsers();
    users = tempUsers ? tempUsers : users;
    console.log('Fetched valid users');
  });

  while (true) {
    const currentContractAddress: string | null = await getContractAddress();

    if (!currentContractAddress) {
      console.log('No address');
    } else if (addressesSeen.has(currentContractAddress)) {
      console.log('No change detected.');
    } else {
      addressesSeen.add(currentContractAddress);
      await sendContractAddress(currentContractAddress, users, ronBot);
      await appendToCoinsSeen(addressesSeen);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
main();
