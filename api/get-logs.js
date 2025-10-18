import { Low, JSONFile } from 'lowdb';

const adapter = new JSONFile('db.json');
const db = new Low(adapter);

export default async function handler(req, res) {
  await db.read();
  db.data ||= { logs: [] };
  res.status(200).json(db.data.logs);
}
