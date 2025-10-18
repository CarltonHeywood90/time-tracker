import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export default async function handler(req, res) {
  try {
    // Connect to MongoDB (reuse connection if already established)
    if (!cachedClient) {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      cachedClient = client;
      cachedDb = client.db("time_tracker"); // same DB name as add-log.js
    }

    const logs = await cachedDb
      .collection("logs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
}
