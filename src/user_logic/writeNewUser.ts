import { google } from 'googleapis';
import { User } from './fetchValidGoogleSheetUsers';

export async function writeNewUser(userToAdd: User): Promise<void> {
  try {
    const serviceAccountKey = './ron-bot-v3-bda2430e12e4.json';

    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SPREADSHEETID;
    const range = 'Sheet1!A:D';

    if (!spreadsheetId) {
      console.error('Invalid spreadsheet ID');
      return;
    }

    console.log('Spreadsheet ID:', spreadsheetId);

    // Read existing rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn('No data found, initializing new sheet.');
    } else {
      // Check if the user already exists
      const userExists = rows.some((row) => row[0] === userToAdd.uid);
      if (userExists) {
        console.log(`User with UID ${userToAdd.uid} already exists.`);
        return;
      }
    }

    // Append the new user
    const newRow = [userToAdd.uid, userToAdd.username, '', ''];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    console.log(`User ${userToAdd.username} added successfully.`);
  } catch (error) {
    console.error('Error managing Google Sheet users:', error);
  }
}
