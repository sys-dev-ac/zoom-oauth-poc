const { google } = require("googleapis");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI,
);

app.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets",
      'https://www.googleapis.com/auth/drive.metadata.readonly', ],
  });
  res.redirect(authUrl);
});

app.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  // Store tokens securely (e.g., in DB or session)
  res.send("Authentication successful! You can now use the app.");
});

// Use the authenticated client to access Google Sheets
const sheets = google.sheets({ version: "v4", auth: oauth2Client });
const drive = google.drive({ version: "v3", auth: oauth2Client });

app.post("/api/create-sheet", async (req, res) => {
  try {
    const title = "api-spreadsheet";

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
      },
    });

    return res.json({
      spreadsheetId: response.data.spreadsheetId,
      url: response.data.spreadsheetUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    return;
  }
});

// List spreadsheets for a user
app.get('/api/list-sheets', async (req, res) => {
  try {
    if (!drive) return res.status(401).send('No tokens stored for this user; re-auth required');

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      spaces: 'drive',
      fields: 'files(id, name, owners, createdTime, modifiedTime, webViewLink)',
      pageSize: 50,
    });

    return res.json(response.data.files || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/get-sheet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "sample"
    });
    
    const result = response.data;
    
    /**
     * response.data structure
     
     response  {
       range: 'sample!A1:Z1000',
       majorDimension: 'ROWS',
       values: [
         [ 'Company', 'Contact', 'Country' ],
         [ 'Alfreds Futterkiste', 'Maria Anders', 'Germany' ],
         [ 'Centro comercial Moctezuma', 'Francisco Chang', 'Mexico' ],
         [ 'Ernst Handel', 'Roland Mendel', 'Austria' ],
         [ 'Island Trading', 'Helen Bennett', 'UK' ],
         [ 'Laughing Bacchus Winecellars', 'Yoshi Tannamuri', 'Canada' ],
         [ 'Magazzini Alimentari Riuniti', 'Giovanni Rovelli', 'Italy' ]
       ]
     }
     
     */
    
    res.json(result || []);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
    }
})

app.listen(8000, () => console.log("Server running on port 5000"));
