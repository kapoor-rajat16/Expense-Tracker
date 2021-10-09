const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

mongoose.connect("mongodb://localhost:27017/etUserDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model("User",userSchema);

const user = new User({
    username: "firstUser",
    email: "firstUser@xyz.com",
    password: "first"
});

// user.save();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/home.html");
});

app.get("/login", function (req, res) {
    res.sendFile(__dirname + "/login.html");
});

app.get("/signup", function (req, res) {
    res.sendFile(__dirname + "/signup.html");
});

app.get("/tracker",function (req,res) {
    res.sendFile(__dirname + "/tracker.html");
});

app.post("/signup", function (req, res) {

    const newUser = new User({
        username:req.body.username,
        email:req.body.email,
        password:req.body.password
    });

    newUser.save(function(err){
        if(err){
            console.log(err);
            res.render("login");
        }
        else{
            res.render("tracker");
        }
    });
});


app.post("/login", function (req, res) {
    console.log(req.body.username);
    console.log(req.body.password);
});


app.listen(3000, function () {
    console.log("Server is running on port 3000");
});