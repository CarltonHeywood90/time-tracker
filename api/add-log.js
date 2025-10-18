import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Connect to MongoDB (reuse connection if already established)
    if (!cachedClient) {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      cachedClient = client;
      cachedDb = client.db("time_tracker"); // name your DB however you like
    }

    const { activity, start, end } = req.body;

    if (!activity || !start || !end) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const log = {
      activity,
      start,
      end,
      createdAt: new Date(),
    };

    await cachedDb.collection("logs").insertOne(log);

    return res.status(200).json({ message: "Log saved successfully", log });
  } catch (error) {
    console.error("Error adding log:", error);
    return res.status(500).json({ error: "Database connection failed" });
  }
}
