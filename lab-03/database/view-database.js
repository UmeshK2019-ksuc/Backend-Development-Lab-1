const { initializeDatabase, db } = require("./db");

async function viewDatabase() {
    await initializeDatabase();

    const books = db.prepare("SELECT * FROM books").all();

    console.log("\n========== BOOK DATABASE ==========\n");

    console.table(books);

    console.log("Total Books:", books.length);
}

viewDatabase();