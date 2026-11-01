# Lab 1: Node.js and Express Server
**Name:** K UMESH  
**Registration Number:** 252U1R6105  
**Section:** CSE AIML 2B


## Live Link
(https://backend-development-lab-1-iuzz.onrender.com)
Deployed using render platform successfully

## Objective
To understand Node.js fundamentals and build a web server using the built-in HTTP module and Express.js.

### Features
- Create a basic HTTP server in Node.js
- Build the same functionality with Express.js
- Handle different routes and HTTP responses
- Return JSON data for the about page and current time
- Display a clean 404 page for unknown routes

## Technologies Used
- Node.js
- Express.js
- JavaScript

## Project Structure

```text
lab-01/
│
├── node_modules/          # Installed dependencies
│
├── screenshots/           # Screenshots of API responses
│   ├── home.png
│   ├── about.png
│   ├── time.png
│   └── 404.png
│
├── .gitignore             # Files ignored by Git
├── http-server.js         # Basic Node.js HTTP server
├── index.js               # Express server and API routes
├── package.json           # Project configuration and dependencies
├── package-lock.json      # Dependency version lock file
└── README.md              # Project documentation
```

**Note:** `node_modules/` is generated automatically when dependencies are installed using `npm install` and is not committed to GitHub.

## Installation and Execution

1. Clone the repository.
2. Navigate to the Lab_1 folder.
3. Install dependencies:

```bash
npm install
```

4. Run the Express server:

```bash
node index.js
```

5. Open http://localhost:3000 in your browser.

## Endpoints

| Method | Endpoint | Description | Status |
|-----|----------|----------------------------------|-----|
| GET | /        | Welcome message                  | 200 |
| GET | /about   | Returns name and section in JSON | 200 |
| GET | /time    | Returns current date and time    | 200 |
| GET | /contact | Unknown route response           | 404 |

## Screenshots

### Home Route
![Home](screenshots/home.png)

### About Route
![About](screenshots/about.png)

### Time Route
![Time](screenshots/time.png)

### 404 Error
![404](screenshots/404.png)

## Notes
Implemented a basic HTTP server using Node.js and recreated it using Express.js. Learned routing, handling requests and responses, HTTP status codes, and 404 error handling.

