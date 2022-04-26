const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const admin = require('firebase-admin');
const app = express();
const port = process.env.PORT || 8080;

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
  res.render("pages/sign-up", {
    type: 'owner'
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

app.post("/sessionLogin", async (req, res) => {
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

app.post("/dog-messages", authMiddleware, async (req, res) => {
  // CS5356 TODO #5
  // Get the message that was submitted from the request body
  // Get the user object from the request body
  // Add the message to the userFeed so its associated with the user
  try {
    const message = req.body.message;
    const user = req.user;
    await userFeed.add(user, message);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send({
      message: err
    });
  }
});

app.listen(port);
console.log("Server star`ted at http://localhost:" + port);
