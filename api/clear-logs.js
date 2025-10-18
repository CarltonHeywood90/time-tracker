import { MongoClient } from "mongodb";

let client;
let logsCollection;

async function getCollection() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("time-tracker");
    logsCollection = db.collection("logs");
  }
  return logsCollection;
}

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    try {
      const collection = await getCollection();
      const result = await collection.deleteMany({});
      console.log("Deleted count:", result.deletedCount); // debug log
      res.status(200).json({ message: "All logs cleared" });
    } catch (err) {
      console.error("Error clearing logs:", err);
      res.status(500).json({ error: "Failed to clear logs" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
