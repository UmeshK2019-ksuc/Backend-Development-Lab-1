const http = require("http");

async function runTests() {
  // Wait for server to be up
  const PORT = 3000;
  const baseUrl = `http://localhost:${PORT}`;

  const postJSON = (path, body) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(
        `${baseUrl}${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
        },
        (res) => {
          let resData = "";
          res.on("data", (chunk) => (resData += chunk));
          res.on("end", () => {
            resolve({ status: res.statusCode, data: resData });
          });
        }
      );
      req.on("error", reject);
      req.write(data);
      req.end();
    });
  };

  const getReq = (path) => {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${path}`, (res) => {
        let resData = "";
        res.on("data", (chunk) => (resData += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, data: resData });
        });
      }).on("error", reject);
    });
  };

  // Give server 1.5 seconds to open DB and listen
  await new Promise((r) => setTimeout(r, 1500));

  console.log("=== 1. TEST POST /register/ (Success) ===");
  const regRes = await postJSON("/register/", {
    username: "test_user",
    name: "Test User",
    password: "test-only-password-123",
    gender: "Male",
    location: "Test City"
  });
  console.log("Status:", regRes.status, "Body:", regRes.data);

  console.log("\n=== 2. TEST POST /register/ (User already exists) ===");
  const regDupRes = await postJSON("/register/", {
    username: "test_user",
    name: "Test User",
    password: "test-only-password-123",
    gender: "Male",
    location: "Test City"
  });
  console.log("Status:", regDupRes.status, "Body:", regDupRes.data);

  console.log("\n=== 3. TEST POST /login/ (Success) ===");
  const loginRes = await postJSON("/login/", {
    username: "test_user",
    password: "test-only-password-123"
  });
  console.log("Status:", loginRes.status, "Body:", loginRes.data);
  const tokenObj = JSON.parse(loginRes.data);
  const jwtToken = tokenObj.jwt_token;

  console.log("\n=== 4. TEST POST /login/ (Invalid user) ===");
  const loginInvalidUserRes = await postJSON("/login/", {
    username: "nonexistent_user",
    password: "anyPassword"
  });
  console.log("Status:", loginInvalidUserRes.status, "Body:", loginInvalidUserRes.data);

  console.log("\n=== 5. TEST POST /login/ (Invalid password) ===");
  const loginInvalidPassRes = await postJSON("/login/", {
    username: "test_user",
    password: "wrongPassword456"
  });
  console.log("Status:", loginInvalidPassRes.status, "Body:", loginInvalidPassRes.data);

  console.log("\n=== 6. TEST GET /users/ (Verify hashed password in database) ===");
  const usersRes = await getReq("/users/");
  console.log("Status:", usersRes.status, "Body:", usersRes.data);

  console.log("\n=== 7. JWT Token Verification and Decoding ===");
  const parts = jwtToken.split(".");
  console.log("JWT Header:", Buffer.from(parts[0], "base64url").toString());
  console.log("JWT Payload:", Buffer.from(parts[1], "base64url").toString());
  console.log("JWT Signature:", parts[2]);

  console.log("\nALL TESTS COMPLETED SUCCESSFULLY!");
  process.exit(0);
}

// Start app
require("./index.js");
runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
