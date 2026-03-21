import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

async function initDb() {
  // Ensure data directory exists
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Read schema
  const schema = fs.readFileSync(
    path.join(__dirname, '../db/schema.sql'),
    'utf8'
  );

  // Create database and run schema
  const db = await open({
    filename: path.join(dataDir, 'tradeup.db'),
    driver: sqlite3.Database
  });

  await db.exec(schema);
  console.log('Database initialized with schema');
  await db.close();
}

initDb().catch(console.error);