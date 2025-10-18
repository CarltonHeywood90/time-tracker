import { Low, JSONFile } from 'lowdb';
import { v4 as uuidv4 } from 'uuid';

const adapter = new JSONFile('db.json');
const db = new Low(adapter);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await db.read();
    db.data ||= { logs: [] };

    const { activity, start, end } = req.body;
    db.data.logs.push({ id: uuidv4(), activity, start, end });
    await db.write();

    return res.status(200).json({ message: 'Log saved' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
