import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkSheets() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  console.log('Checking spreadsheet sheets...');
  console.log('Sheet ID:', sheetId);

  if (key?.startsWith('"')) key = key.substring(1, key.length - 1);
  key = key?.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: email?.trim(),
    key: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    console.log('Spreadsheet title:', res.data.properties.title);
    console.log('Available sheets:');
    res.data.sheets.forEach(sheet => {
      console.log(' -', sheet.properties.title);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSheets();