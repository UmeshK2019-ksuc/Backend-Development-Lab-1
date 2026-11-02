const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "bookstore.db");
let db = null;
const PORT = process.env.PORT || 3000;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        console.log("Database connected successfully");

        app.listen(PORT, () => {
            console.log(`Server Running at http://localhost:${PORT}/`);
        });

    } catch (e) {
        console.error(`Error initializing database or server: ${e.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

app.get("/books/", async (request, response) => {
    const getBooksQuery = `
        SELECT *
        FROM book;`
    const books = await db.all(getBooksQuery);
    response.send(books);
});

app.get("/books/:bookId/", async (request, response) => {
  const { bookId } = request.params;
  const getBookQuery = `
    SELECT *
    FROM book
    WHERE id = ?;`;
  const book = await db.get(getBookQuery, [bookId]);
  response.send(book);
});

app.post("/books/", async (request, response) => {
  const bookDetails = request.body;
  const {
    title,
    author,
    price,
    pages,
  } = bookDetails;
  const addBookQuery = `
    INSERT INTO
      book (title, author, price, pages)
    VALUES
      (
       ?, ?, ?, ?
      );`

  const dbResponse = await db.run(addBookQuery, [title, author, price, pages]);
  const bookId = dbResponse.lastID;
  response.status(201).send({ bookId: bookId });
});

app.put("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const bookDetails = request.body;
    const { title, author, price, pages } = bookDetails;
    const updateBookQuery = `
        UPDATE book
        SET
            title = ?,
            author = ?,
            price = ?,
            pages = ?
        WHERE 
            id = ?;`
    await db.run(updateBookQuery, [
        title,
        author,
        price,
        pages,
        bookId
    ]);
    response.send("Book updated successfully");
});

app.delete("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const deleteBookQuery = `
        DELETE FROM book
        WHERE id = ?;`
    await db.run(deleteBookQuery, [bookId]);
    response.send("Book deleted successfully");
});