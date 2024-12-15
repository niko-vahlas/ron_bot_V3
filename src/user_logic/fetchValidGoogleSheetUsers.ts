import { google } from 'googleapis';

export interface User {
  uid: string;
  username: string;
  dateLastPaid: string; // ISO string representation
  quantityLastSent: string;
}

export async function fetchValidGoogleSheetUsers(): Promise<
  User[] | undefined
> {
  try {
    const serviceAccountKey = './ron-bot-v3-bda2430e12e4.json';

    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SPREADSHEETID;
    const range = 'Sheet1!A:D';

    if (!spreadsheetId) {
      console.error('Invalid spreadsheet ID');
      return;
    }

    console.log('Spreadsheet ID:', spreadsheetId);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn('No data found.');
      return [];
    }

    const users: User[] = rows.slice(1).map((row) => ({
      uid: row[0],
      username: row[1],
      dateLastPaid: row[2],
      quantityLastSent: row[3],
    }));

    return filterUsers(users);
  } catch (error) {
    console.error('Error fetching Google Sheet users:', error);
    return;
  }
}

function filterUsers(users: User[]) {
  const now = new Date();
  // Figure out when the user last paid, and use the quanity they sent, for now we'll just last paid date
  const filteredUsers = users.filter(
    (user) => new Date(user.dateLastPaid) <= now
  );
  return filteredUsers;
}
