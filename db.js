const path = require("path");
const Database = require("better-sqlite3");
const sites = require("./sites");

const db = new Database(path.join(__dirname, "votes.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  )
`);

const insertIfMissing = db.prepare(
  "INSERT OR IGNORE INTO votes (id, count) VALUES (?, 0)"
);
const seedAll = db.transaction((list) => {
  for (const site of list) insertIfMissing.run(site.id);
});
seedAll(sites);

module.exports = db;
