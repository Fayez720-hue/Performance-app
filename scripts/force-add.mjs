import { google } from "googleapis";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// 1. Load your JSON key file directly
// Make sure you place your service-account.json in the project root
const keyFile = JSON.parse(readFileSync("./service-account.json", "utf8"));
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const auth = new google.auth.JWT({
  email: keyFile.client_email,
  key: keyFile.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function setupUsers() {
  const sheets = google.sheets({ version: "v4", auth });
  const users = [
    { email: "amrmaged412@gmail.com", name: "Amr Maged", role: "Team Member" },
    { email: "arahmantalaat0777@gmail.com", name: "Abdel Rahman Talaat", role: "Manager" }
  ];

  console.log(`Using Spreadsheet ID: ${SPREADSHEET_ID}`);

  for (const user of users) {
    console.log(`Processing ${user.name}...`);

    // Append to Employees
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Employees!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[user.email, user.name, user.role]] },
    });

    if (user.role === "Team Member") {
      console.log(`Creating ${user.name}'s personal sheet...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: user.name } } }] },
      }).catch((e) => console.log("Sheet status:", e.message.includes("already exists") ? "Already exists" : e.message));

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
