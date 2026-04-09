import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
  console.error("Missing required environment variables in .env.local");
  process.exit(1);
}

// Handle various ways the private key might be escaped or quoted
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.substring(1, privateKey.length - 1);
}

privateKey = privateKey.replace(/\\n/g, "\n");

console.log(`Private Key length: ${privateKey.length}`);
console.log(`Private Key starts with: ${privateKey.substring(0, 20)}...`);
console.log(`Private Key ends with: ...${privateKey.substring(privateKey.length - 20)}`);

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function setupUsers() {
  const sheets = google.sheets({ version: "v4", auth });
  const users = [
    { email: "canshiftagency@gmail.com", name: "Admin", role: "Admin" },
    { email: "arahmantalaat0777@gmail.com", name: "Abdel Rahman Talaat", role: "Manager" },
    { email: "amrmaged412@gmail.com", name: "Amr Maged", role: "Team Member" }
  ];

  console.log(`Using Spreadsheet ID: ${SPREADSHEET_ID}`);

  for (const user of users) {
    console.log(`Processing ${user.name} (${user.email})...`);

    // Check if user already exists in Employees sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Employees!A:A",
    }).catch(() => ({ data: { values: [] } }));

    const existingEmails = (response.data.values || []).map(row => row[0]);

    if (existingEmails.includes(user.email)) {
      console.log(`User ${user.email} already exists in Employees sheet.`);
    } else {
      // Append to Employees
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Employees!A:C",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[user.email, user.name, user.role]] },
      });
      console.log(`Added ${user.name} to Employees sheet.`);
    }

    if (user.role === "Team Member") {
      console.log(`Ensuring personal sheet for ${user.name}...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: user.name } } }] },
      }).catch((e) => {
        if (!e.message.includes("already exists")) {
           console.error(`Error creating sheet for ${user.name}:`, e.message);
        }
      });

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
    }
    console.log(`✅ ${user.name} processed!`);
  }
}

setupUsers().catch(console.error);
