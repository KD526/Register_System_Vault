const express = require("express")
const app = express()

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: false}))
app.use(express.static("public"))

app.get("/", (req, res) => {
    res.render("homepage")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/register", (req, res) => {
    const errors = []
    if (typeof req.body.username !== "string") req.body.username = ""
    if (typeof req.body.password !== "string") req.body.password = ""

    req.body.username = req.body.username.trim()
    if (!req.body.username) errors.push("Must provide username!")

    res.send("Thank you for registering!")
})

app.listen(3000)