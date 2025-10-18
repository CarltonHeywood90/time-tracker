import express from "express";
import bodyParser from "body-parser";
const app = express();
app.use(bodyParser.json());

// Parse JSON bodies for POST requests
app.use(express.json());

// In-memory log storage for testing
let logs = [];

app.get("/api/get-logs", (req, res) => {
  res.json(logs);
});

app.post("/api/add-log", (req, res) => {
  const { activity, start, end } = req.body;
  logs.push({ activity, start, end });
  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
