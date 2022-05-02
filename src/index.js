const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const admin = require('firebase-admin');
const app = express();
const port = process.env.PORT || 8080;

// CS5356 TODO #2
// Uncomment this next line after you've created
// serviceAccountKey.json
const serviceAccount = require("./../config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const userFeed = require("./app/user-feed");
const authMiddleware = require("./app/auth-middleware");
const userService = require("./app/user-service");

// use cookies
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/static", express.static("static/"));

// use res.render to load up an ejs view file
// index page
app.get("/", function (req, res) {
  res.render("pages/index");
});

app.get("/sign-in", function (req, res) {
  res.render("pages/sign-in");
});

app.get("/sign-up", function (req, res) {
  res.render("pages/sign-up");
});

app.get("/settings", authMiddleware, async function (req, res) {
  const userInfo = await userService.getUserByEmail(req.user.email);
  res.render("pages/settings", {
    user: req.user,
    userInfo
  });
});

app.get("/dashboard", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const userInfo = await userService.getUserByEmail(req.user.email);
  res.render("pages/dashboard", {
    user: req.user,
    userInfo,
    feed
  });
});

app.get("/write-note", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  res.render("pages/write-note", {
    user: req.user,
    feed
  });
});

app.get("/make-a-wish", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  res.render("pages/make-a-wish", {
    user: req.user,
    feed
  });
});

app.post("/sessionLogin", async (req, res) => {
  // CS5356 TODO #4
  // Get the ID token from the request body
  // Create a session cookie using the Firebase Admin SDK
  // Set that cookie with the name 'session'
  // And then return a 200 status code instead of a 501
  const idToken = req.body.idToken;
  const signInType = req.body.signInType;
  const username = req.body.username;

  const expiresIn = 60 * 60 * 1000;

  admin.auth().createSessionCookie(idToken, {
      expiresIn
    })
    .then(
      (sessionCookie) => {
        // Set cookie policy for session cookie.
        const options = {
          maxAge: expiresIn,
          httpOnly: true,
          secure: true
        };
        res.cookie('session', sessionCookie, options);

        admin
          .auth()
          .verifySessionCookie(sessionCookie, true /** checkRevoked */ )
          .then(userData => {
            console.log("Logged in:", userData.email);

            const id = userData.sub;
            const email = userData.email;

            if (signInType === 'register') {
              // save it to firestore
              userService.createUser(id, email, username)
            }

            res.status(201).send(JSON.stringify({
              status: 'success'
            }))
          })
      },
      (error) => {
        res.status(401).send(error.toString());
      }
    );
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/sign-in");
});

app.post("/write-notes", authMiddleware, async (req, res) => {

  try {
    const message = req.body.message;
    const user = req.user;
    const wishornote = false;
    await userFeed.add(user, message, wishornote);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send({
      message: err
    });
  }
});

app.post("/make-wish", authMiddleware, async (req, res) => {

  try {
    const message = req.body.message;
    const user = req.user;
    const wishornote = true;
    await userFeed.add(user, message, wishornote);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send({
      message: err
    });
  }
});

app.post("/edit-profile", authMiddleware, async (req, res) => {
  // received changed info from FE
  // store to the firestore/db
  const username = req.body.username;
  const location = req.body.location;
  const viewer = req.body.viewer;
  const email = req.user.email;
  userService.updateUser(email, username, viewer, location)
})

app.listen(port);
console.log("Server star`ted at http://localhost:" + port);