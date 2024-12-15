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

  (() => {
    cron.schedule('0 0 * * *', async () => {
      const tempUsers = await fetchValidGoogleSheetUsers();
      users = tempUsers ? tempUsers : users;
      console.log('Daily cron job running at midnight');
    });
  })();

  while (true) {
    const currentContractAddress: string | null = await getContractAddress();

    if (!currentContractAddress) {
      console.log('No address');
    } else if (addressesSeen.has(currentContractAddress)) {
      console.log('No change detected.');
    } else {
      addressesSeen.add(currentContractAddress);
      await sendContractAddress(currentContractAddress, users);
      await appendToCoinsSeen(addressesSeen);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
main();
