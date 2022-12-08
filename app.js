const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//Register user
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const getUserDetails = `
    SELECT * FROM user
    WHERE username = '${username}';
    `;
  const dbUser = await db.get(getUserDetails);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    if (dbUser === undefined) {
      const creatingNewUser = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );
        `;
      const dbResponse = await db.run(creatingNewUser);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//Login User
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserDetails = `
    SELECT *
    FROM user WHERE username = '${username}';
    `;
  const dbUser = await db.get(getUserDetails);
  console.log(dbUser.password);
  console.log(password);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatched);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Update the password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserDetails = `
    SELECT * FROM user WHERE username='${username}';
    `;
  let dbUser = await db.get(getUserDetails);
  console.log(dbUser);
  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateNewPsasword = `
          UPDATE user 
          SET password = '${hashedPassword}';
          `;
      await db.run(updateNewPsasword);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
