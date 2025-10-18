import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export default async function handler(req, res) {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!cachedClient) {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      cachedClient = client;
      cachedDb = client.db("time_tracker"); // SAME DB NAME
    }

    const collection = cachedDb.collection("logs");

    // Debug: check how many exist before deleting
    const before = await collection.countDocuments();

    const result = await collection.deleteMany({});
    const after = await collection.countDocuments();

    console.log("Clear logs debug — Before:", before, "Deleted:", result.deletedCount, "After:", after);

    return res.status(200).json({ message: `All logs cleared. Deleted: ${result.deletedCount}` });
  } catch (error) {
    console.error("Error clearing logs:", error);
    return res.status(500).json({ error: "Failed to clear logs" });
  }
}
