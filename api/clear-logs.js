import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("time-tracker");
const logsCollection = db.collection("logs");

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    try {
      await logsCollection.deleteMany({});
      res.status(200).json({ message: "All logs cleared" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to clear logs" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
