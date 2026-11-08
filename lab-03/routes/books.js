const express = require("express");
const { db } = require("../database/db");

const router = express.Router();

function isValidId(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

function validateBook(body) {
  const { title, author, price } = body || {};
  const errors = [];

  if (typeof title !== "string" || title.trim() === "") {
    errors.push("Title is required");
  }
  if (typeof author !== "string" || author.trim() === "") {
    errors.push("Author is required");
  }
  if (
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    errors.push("Price must be a non-negative number");
  }

  return errors;
}

// GET /books - search, sort, filter and paginate
router.get("/", (req, res, next) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = "10",
      offset = "0",
      min_price,
      max_price
    } = req.query;

    const allowedSortColumns = ["id", "title", "author", "price", "created_at"];
    const sortColumn = allowedSortColumns.includes(order_by) ? order_by : "id";
    const sortDirection = String(order).toUpperCase() === "DESC" ? "DESC" : "ASC";

    const parsedLimit = Number.parseInt(limit, 10);
    const parsedOffset = Number.parseInt(offset, 10);

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ message: "limit must be an integer between 1 and 100" });
    }
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ message: "offset must be a non-negative integer" });
    }
    if (min_price !== undefined && (!Number.isFinite(Number(min_price)) || Number(min_price) < 0)) {
      return res.status(400).json({ message: "min_price must be a non-negative number" });
    }
    if (max_price !== undefined && (!Number.isFinite(Number(max_price)) || Number(max_price) < 0)) {
      return res.status(400).json({ message: "max_price must be a non-negative number" });
    }
    if (min_price !== undefined && max_price !== undefined && Number(min_price) > Number(max_price)) {
      return res.status(400).json({ message: "min_price cannot be greater than max_price" });
    }

    const conditions = [];
    const values = [];

    if (String(search_q).trim() !== "") {
      conditions.push("title LIKE ?");
      values.push(`%${String(search_q).trim()}%`);
    }
    if (min_price !== undefined) {
      conditions.push("price >= ?");
      values.push(Number(min_price));
    }
    if (max_price !== undefined) {
      conditions.push("price <= ?");
      values.push(Number(max_price));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT id, title, author, price, created_at
      FROM books
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const books = db.prepare(sql).all(...values, parsedLimit, parsedOffset);
    return res.status(200).json({
      message: "Books retrieved successfully",
      count: books.length,
      data: books
    });
  } catch (error) {
    next(error);
  }
});

// POST /books - create a book
router.post("/", (req, res, next) => {
  try {
    const errors = validateBook(req.body);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { title, author, price } = req.body;
    const result = db.prepare(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)"
    ).run(title.trim(), author.trim(), Number(price));

    const createdBook = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
    return res.status(201).json({ message: "Book created successfully", data: createdBook });
  } catch (error) {
    next(error);
  }
});

// GET /books/:id - retrieve one book
router.get("/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Book id must be a positive integer" });
    }
    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(Number(req.params.id));
    if (!book) return res.status(404).json({ message: "Book not found" });
    return res.status(200).json({ message: "Book retrieved successfully", data: book });
  } catch (error) {
    next(error);
  }
});

// PUT /books/:id - update a book
router.put("/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Book id must be a positive integer" });
    }
    const existing = db.prepare("SELECT id FROM books WHERE id = ?").get(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Book not found" });

    const errors = validateBook(req.body);
    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    const { title, author, price } = req.body;
    db.prepare("UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?")
      .run(title.trim(), author.trim(), Number(price), Number(req.params.id));

    const updated = db.prepare("SELECT * FROM books WHERE id = ?").get(Number(req.params.id));
    return res.status(200).json({ message: "Book updated successfully", data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /books/:id - delete a book
router.delete("/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Book id must be a positive integer" });
    }
    const result = db.prepare("DELETE FROM books WHERE id = ?").run(Number(req.params.id));
    if (result.changes === 0) return res.status(404).json({ message: "Book not found" });
    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
