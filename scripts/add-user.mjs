import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

async function getAuth() {
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error("Missing Google Sheets credentials in .env.local");
  }

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
}

async function run() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const user = {
    email: "amrmaged412@gmail.com",
    name: "Amr Maged",
    role: "Team Member"
  };

  console.log(`Creating user: ${user.name} (${user.email})...`);

  // 1. Add to Employees master sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Employees!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[user.email, user.name, user.role]] },
  });
  console.log("Added to Employees sheet.");

  // 2. Create personal tracking sheet
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: user.name,
              },
            },
          },
        ],
      },
    });
    console.log(`Created personal sheet: ${user.name}`);
  } catch (e) {
    console.log("Sheet might already exist or error:", e.message);
  }

  // 3. Add Headers to the new sheet
  const headers = [
    "EMP ID", "Name", "Date", "Task", "References", "Comments", "progress",
    "Task Starting Date", "Deadline", "Task Estimated Time", "Task Time taken",
    "Submission Link", "Submission Date", "deadline adherence", "grading",
    "overall score", "Task Time Stamp", "Edits", "No. of edits", "Task ID"
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${user.name}'!A1:T1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
  console.log("Added headers to personal sheet.");

  console.log("✅ Successfully set up user Amr Maged!");
}

run().catch(console.error);
