const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET environment variable is required");
}

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        gender TEXT,
        location TEXT
      );
    `);

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Root endpoint
app.get("/", (req, res) => {
  res.send("Lab 4: Authentication and User Management API (Registration, Login & JWT)");
});

// POST /register/ - Register a new user
const registerHandler = async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  if (!username || !password || !name) {
    return response.status(400).send("Username, name, and password are required");
  }

  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = ?;
  `;
  const dbUser = await db.get(selectUserQuery, [username]);

  if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES (?, ?, ?, ?, ?);
    `;
    await db.run(createUserQuery, [username, name, hashedPassword, gender || null, location || null]);
    response.status(200).send("User created successfully");
  } else {
    response.status(400).send("User already exists");
  }
};

app.post("/register/", registerHandler);
app.post("/register", registerHandler);

// POST /login/ - User login and JWT generation
const loginHandler = async (request, response) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return response.status(400).send("Username and password are required");
  }

  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = ?;
  `;
  const dbUser = await db.get(selectUserQuery, [username]);

  if (dbUser === undefined) {
    response.status(400).send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, SECRET_KEY);
      response.send({ jwt_token: jwtToken });
    } else {
      response.status(400).send("Invalid password");
    }
  }
};

app.post("/login/", loginHandler);
app.post("/login", loginHandler);

// GET /users/ - View registered users and verify passwords are stored as hashes
app.get("/users/", async (request, response) => {
  const getUsersQuery = `
    SELECT id, username, name, password, gender, location
    FROM user;
  `;
  const users = await db.all(getUsersQuery);
  response.send(users);
});
app.get("/users", async (request, response) => {
  const getUsersQuery = `
    SELECT id, username, name, password, gender, location
    FROM user;
  `;
  const users = await db.all(getUsersQuery);
  response.send(users);
});

module.exports = app;
