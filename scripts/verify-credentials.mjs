import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function verify() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  console.log("--- Credential Check ---");
  console.log("Email:", `"${email}"`);
  console.log("Sheet ID:", `"${sheetId}"`);
  console.log("Key Length:", key?.length);

  if (key?.startsWith('"')) key = key.substring(1, key.length - 1);
  key = key?.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: email?.trim(),
    key: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  try {
    console.log("Attempting to get auth token...");
    const token = await auth.getAccessToken();
    console.log("✅ SUCCESS: Auth token generated.");

    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    console.log("✅ SUCCESS: Connected to spreadsheet:", res.data.properties.title);
  } catch (err) {
    console.error("❌ FAILED:", err.message);
    if (err.message.includes("account not found")) {
      console.error("\nTIP: The Service Account Email might be misspelled or deleted in Google Cloud Console.");
    }
  }
}

verify();
