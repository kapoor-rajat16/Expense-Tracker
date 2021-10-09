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
            res.redirect("signup");
        }
        else if (req.body.username === "" || req.body.email === "" || req.body.password ==="" ) {
            res.redirect("signup");
        }
        else{
            res.redirect("tracker");
        }
    });
});


app.post("/login", function (req, res) {
    const currentusername = req.body.username;
    const password = req.body.password;

    User.findOne({username:currentusername}, function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                if(foundUser.password === password){
                    res.redirect("tracker");
                }
            }
        }
    });
});


app.listen(3000, function () {
    console.log("Server is running on port 3000");
});