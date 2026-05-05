import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testAppend() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  console.log('Sheet ID:', sheetId);
  console.log('Email:', email);

  if (key?.startsWith('"')) key = key.substring(1, key.length - 1);
  key = key?.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: email?.trim(),
    key: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    console.log('Testing append to performance sheet...');
    const values = [['Test', '2024-01-01', 'Test task']];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'performance',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    console.log('✅ SUCCESS: Append worked');
    console.log('Updated range:', response.data.updates?.updatedRange);
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

testAppend();