import { MongoClient, ObjectId } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!cachedClient) {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      cachedClient = client;
      cachedDb = client.db("time_tracker"); // SAME DB NAME
    }

    const collection = cachedDb.collection("logs");
    const { ids } = req.body || {};

    // Debug info
    const before = await collection.countDocuments();

    let result;
    if (Array.isArray(ids) && ids.length > 0) {
      // Delete only selected logs
      const objectIds = ids.map(id => new ObjectId(id));
      result = await collection.deleteMany({ _id: { $in: objectIds } });
    } else {
      // Fallback: delete all logs
      result = await collection.deleteMany({});
    }

    const after = await collection.countDocuments();

    console.log("Clear logs debug — Before:", before, "Deleted:", result.deletedCount, "After:", after);

    const message = Array.isArray(ids) && ids.length > 0
      ? `Deleted ${result.deletedCount} selected log(s).`
      : `All logs cleared. Deleted: ${result.deletedCount}`;

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Error clearing logs:", error);
    return res.status(500).json({ error: "Failed to clear logs" });
  }
}
