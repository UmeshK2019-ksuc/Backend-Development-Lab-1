const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

let database;

function persistDatabase() {
  const databaseFile = path.resolve(process.env.DATABASE_FILE || "./database/books.db");
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
  fs.writeFileSync(databaseFile, Buffer.from(database.export()));
}

// A small adapter keeps route code readable while sql.js runs SQLite in WebAssembly.
const db = {
  prepare(sql) {
    return {
      all(...params) {
        const statement = database.prepare(sql);
        try {
          statement.bind(params);
          const rows = [];
          while (statement.step()) rows.push(statement.getAsObject());
          return rows;
        } finally {
          statement.free();
        }
      },
      get(...params) {
        const statement = database.prepare(sql);
        try {
          statement.bind(params);
          return statement.step() ? statement.getAsObject() : undefined;
        } finally {
          statement.free();
        }
      },
      run(...params) {
        database.run(sql, params);
        const changes = database.getRowsModified();
        const lastInsertRowid = database.exec("SELECT last_insert_rowid() AS id")[0]
          ?.values[0][0] ?? 0;
        persistDatabase();
        return { changes, lastInsertRowid };
      }
    };
  }
};

async function initializeDatabase() {
  const SQL = await initSqlJs();
  const databaseFile = path.resolve(process.env.DATABASE_FILE || "./database/books.db");
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

  if (fs.existsSync(databaseFile)) {
    database = new SQL.Database(new Uint8Array(fs.readFileSync(databaseFile)));
  } else {
    database = new SQL.Database();
  }

  database.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL CHECK(price >= 0),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const count = db.prepare("SELECT COUNT(*) AS count FROM books").get().count;
  if (count === 0) {
    const insert = db.prepare(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)"
    );
    insert.run("Python Basics", "John", 450);
    insert.run("Advanced Python", "Sarah", 650);
    insert.run("Java Programming", "David", 800);
    insert.run("C Programming", "Dennis", 350);
    insert.run("Python for Beginners", "Mary", 550);
  } else {
    persistDatabase();
  }
}

module.exports = { db, initializeDatabase };
