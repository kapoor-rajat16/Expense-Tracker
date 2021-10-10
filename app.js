require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var LocalStrategy = require('passport-local').Strategy;

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/etUserDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/home.html");
});

app.get("/login", function (req, res) {
    res.sendFile(__dirname + "/login.html");
});

app.get("/signup", function (req, res) {
    res.sendFile(__dirname + "/signup.html");
});

app.get("/tracker", function (req, res) {
    if (req.isAuthenticated()) {
        res.sendFile(__dirname + "/tracker.html");
    }
     else{
        res.redirect("login");
     }  
});

app.post("/tracker", function (req,res) {
    req.logout();
    res.redirect("/");
});

app.post("/signup", function (req, res) {

   User.register({username:req.body.username}, req.body.password, function (err,user) {
       if (err) {
           console.log(err);
           res.redirect("signup");
       }
       else{
           passport.authenticate("local")(req,res,function () {
            res.redirect("tracker");         
           });
       }
   });

});




app.post("/login", function (req, res) {

    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user,function (err) {
        if (err) {
            console.log(err);
            res.redirect("signup");
        }
        else{
            passport.authenticate("local")(req,res,function () {
                res.redirect("tracker");         
               });
        }    
    });

});


app.listen(3000, function () {
    console.log("Server is running on port 3000");
});
// else if (req.body.username === "" || req.body.email === "" || req.body.password === "") {
//     res.redirect("signup");
// }