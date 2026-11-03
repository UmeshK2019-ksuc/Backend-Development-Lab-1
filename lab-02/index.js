const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "bookstore.db");
const PORT = process.env.PORT || 3000;
let db = null;

const validateBookDetails = (bookDetails = {}) => {
    const { title, author, price, pages } = bookDetails;
    const parsedPrice = Number(price);
    const parsedPages = Number(pages);

    if (!title || !author || price === undefined || pages === undefined) {
        return false;
    }

    if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedPages)) {
        return false;
    }

    return true;
};

const getBookById = async (bookId) => {
    const getBookQuery = `
        SELECT *
        FROM book
        WHERE id = ?;`;

    return db.get(getBookQuery, [bookId]);
};

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                author TEXT,
                price INTEGER,
                pages INTEGER
            );
        `);

        console.log("Database connected successfully");

        if (require.main === module) {
            app.listen(PORT, () => {
                console.log(`Server Running at http://localhost:${PORT}/`);
            });
        }
    } catch (error) {
        console.error(`Error initializing database or server: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

app.get("/books/", async (request, response) => {
    const getBooksQuery = `SELECT * FROM book;`;
    const books = await db.all(getBooksQuery);
    response.status(200).json(books);
});

app.get("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const book = await getBookById(bookId);

    if (!book) {
        return response.status(404).json({ message: "Book not found" });
    }

    response.status(200).json(book);
});

app.post("/books/", async (request, response) => {
    const bookDetails = request.body;

    if (!validateBookDetails(bookDetails)) {
        return response.status(400).json({
            message: "title, author, price, and pages are required"
        });
    }

    const { title, author, price, pages } = bookDetails;
    const addBookQuery = `
        INSERT INTO
            book (title, author, price, pages)
        VALUES
            (?, ?, ?, ?);`;

    const dbResponse = await db.run(addBookQuery, [title, author, Number(price), Number(pages)]);
    response.status(201).json({ bookId: dbResponse.lastID });
});

app.put("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const bookDetails = request.body;

    const existingBook = await getBookById(bookId);
    if (!existingBook) {
        return response.status(404).json({ message: "Book not found" });
    }

    if (!validateBookDetails(bookDetails)) {
        return response.status(400).json({
            message: "title, author, price, and pages are required"
        });
    }

    const { title, author, price, pages } = bookDetails;
    const updateBookQuery = `
        UPDATE book
        SET
            title = ?,
            author = ?,
            price = ?,
            pages = ?
        WHERE id = ?;`;

    await db.run(updateBookQuery, [title, author, Number(price), Number(pages), bookId]);
    response.status(200).json({ message: "Book updated successfully" });
});

app.delete("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const existingBook = await getBookById(bookId);

    if (!existingBook) {
        return response.status(404).json({ message: "Book not found" });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    await db.run(deleteBookQuery, [bookId]);
    response.status(200).json({ message: "Book deleted successfully" });
});

app.use((error, request, response, next) => {
    console.error(error);
    response.status(500).json({ message: "Internal server error" });
});

module.exports = app;