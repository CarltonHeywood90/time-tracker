import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!cachedClient) {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      cachedClient = client;
      cachedDb = client.db("time_tracker");
    }

    const categories = await cachedDb.collection("categories").find().toArray();
    return res.status(200).json(categories.map(c => c.name));
  } catch (err) {
    console.error("Error fetching categories:", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
}
