require("dotenv").config()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")
const express = require("express")
//sqlite3
const db = require("better-sqlite3")("app.db")
db.pragma("journal_mode = WAL")

//db setup
const createTables = db.transaction(() => {
    db.prepare(
        `
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username STRING NOT NULL UNIQUE,
        password STRING NOT NULL
        )
        `
    ).run()
})

createTables()

//initialize express
const app = express()
//
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))
app.use(cookieParser())

//middleware
app.use(function (req, res, next) {
    res.locals.errors = []

    try {
        const decoded = jwt.verify(req.cookies.mainApp, process.env.JWT_KEY)
        req.user = decoded

    } catch (error) {
        req.user = false
    }

    res.locals.user = req.user
    console.log(req.user)

    next()
})

//homepage 
app.get("/", (req, res) => {

    if(req.user) {
        return res.render("dashboard")
    }
    res.render("homepage")
})

//write login logic here
app.post("/login", (req, res) => {
    const errors = []
    if (typeof req.body.username !== "string") req.body.username = ""
    if (typeof req.body.password !== "string") req.body.password = ""

    if(req.body.username.trim()== "") errors.push("Invalid username/password!")
    if(req.body.username.trim() == "") eerors.push("Invalid password/username!")


})

//logout
app.get("/logout", (req, res) => {
    res.clearCookie("mainApp")
    res.redirect("/")
})

///register user
app.post("/register", (req, res) => {
    const errors = []
    if (typeof req.body.username !== "string") req.body.username = ""
    if (typeof req.body.password !== "string") req.body.password = ""

    req.body.username = req.body.username.trim()
    //registration checks
    if (!req.body.username) errors.push("You must provide your username!")
    if (req.body.username && req.body.username.length < 3) errors.push("Must be atleast 3 characters!")
    if (req.body.username && req.body.username.length > 10) errors.push("Cannot be more than 10 characters!")
    if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/)) errors.push("Cn only have letters and numbers!")

    if (!req.body.password) errors.push("You must provide your password!")
    if (req.body.password && req.body.password.length < 8) errors.push("password Must be atleast 8 characters!")
    if (req.body.password && req.body.password.length > 20) errors.push("password Cannot be more than 20 characters!")

    if (errors.length) {
        return res.render("homepage", { errors })
    }

    // Check if username already exists
    const checkUsername = db.prepare("SELECT username * FROM users WHERE username = ?");
    const existingUser = checkUsername.get(req.body.username);

    if (existingUser) {
        res.status(409).send("Username already exists. Please choose another.");
    } else {

        // Proceed with user registration
        const salt = bcrypt.genSaltSync(10);
        req.body.password = bcrypt.hashSync(req.body.password, salt);
        const ourStatement = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        const result = ourStatement.run(req.body.username, req.body.password);

        const checkResult = db.prepare("SELECT * FROM users WHERE ROWID = ?");
        const user = checkResult.get(result.lastInsertRowid);

        // Log user and give them a cookie
        const tokenValue = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 3600 * 24, color: "blue", userId: user.id, username: user.username }, process.env.JWT_KEY);
        res.cookie("mainApp", tokenValue, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 // In milliseconds
        });
        res.send("Thank you for joining!");
    }

    //logic section
})

app.listen(3000)