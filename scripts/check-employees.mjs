import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
  privateKey = privateKey.substring(1, privateKey.length - 1);
}
privateKey = privateKey?.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function check() {
  const sheets = google.sheets({ version: "v4", auth });
  console.log("Reading Spreadsheet ID:", SPREADSHEET_ID);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Employees!A1:E10",
  });

  console.log("Sheet Contents:");
  console.log(JSON.stringify(response.data.values, null, 2));
}

check().catch(console.error);
