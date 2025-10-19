import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { activity } = req.body;
  if (!activity || activity.trim() === "") {
    return res.status(400).json({ error: "Activity name is required" });
  }

  try {
    // Connect to MongoDB if not cached
    if (!cachedClient) {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      cachedClient = client;
      cachedDb = client.db("time_tracker"); // same DB name as your logs
    }

    const collection = cachedDb.collection("categories");

    // Check if the activity already exists (case-insensitive)
    const exists = await collection.findOne({ name: { $regex: `^${activity}$`, $options: "i" } });
    if (exists) {
      return res.status(409).json({ error: "Activity already exists" });
    }

    // Insert new activity
    await collection.insertOne({ name: activity });

    return res.status(200).json({ message: `Activity "${activity}" added.` });
  } catch (err) {
    console.error("Error adding activity:", err);
    return res.status(500).json({ error: "Failed to add activity" });
  }
}
