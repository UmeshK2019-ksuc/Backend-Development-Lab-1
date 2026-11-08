require("dotenv").config();

const express = require("express");
const booksRouter = require("./routes/books");
const { initializeDatabase } = require("./database/db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Lab 3 REST API is running",
    endpoints: {
      books: "GET /books",
      createBook: "POST /books",
      getBook: "GET /books/:id",
      updateBook: "PUT /books/:id",
      deleteBook: "DELETE /books/:id"
    }
  });
});

app.use("/books", booksRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not initialize the database:", error);
    process.exit(1);
  });
