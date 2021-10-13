require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.set("view engine", "ejs");

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


const TransactionSchema = new mongoose.Schema({

    flow: {
        type: String
    },

    userid: {
        type: String
    },
    amount: {
        type: Number,
        required: [true, 'Please add a number']
    },
    category: {
        type: String,
        required: [true, 'Please select one of these category']
    },
    mode: {
        type: String,
        required: [true, 'Please select one of these category']
    },
    note: {
        type: String,
        trim: true,
        required: [true, 'Please add some text']
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
    // recipt:{
    //     type: Image
    // }
});
const transactions = mongoose.model('Transaction', TransactionSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    balance: Number,
    totalCredit: Number,
    totalDebit: Number
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/tracker",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate = require('mongoose-findorcreate')({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/tracker", function (req, res) {
    // res.sendFile(__dirname + "/tracker.html");
    res.render("tracker");
});

app.get("/login", function (req, res) {
    res.sendFile(__dirname + "/login.html");
});

app.get("/signup", function (req, res) {
    res.sendFile(__dirname + "/signup.html");
});

app.get("/tracker", function (req, res) {
    if (req.isAuthenticated()) {
        // res.sendFile(__dirname + "/tracker.html");
        res.render("tracker", { User: req.user });
    }
    else {
        res.redirect("login");
    }
});

app.get("/income", function (req, res) {

    if (req.isAuthenticated()) {
        // res.sendFile(__dirname + "/income.html");
        res.render("income", { User: req.user });
    }
    else {
        res.redirect("login");
    }
});
app.get("/auth/google/income", function (req, res) {
    if (req.isAuthenticated()) {
        // res.sendFile(__dirname + "/income.html");
        res.render("income");
    }
    else {
        res.redirect("login");
    }
});
app.get("/charts", function (req, res) {
    if (req.isAuthenticated()) {
        // res.sendFile(__dirname + "/charts.html");
        res.render("charts")
    }
    else {
        res.redirect("login");
    }
});
app.get("/history", function (req, res) {
    if (req.isAuthenticated()) {
        transactions.find()
            .exec()
            .then(results => res.render("history", { transactions: results, User: req.user }))
            .catch(err => res.redirect("tracker"));

    }
    else {
        res.redirect("login");
    }
});

app.post("/tracker", function (req, res) {
    req.logout();
    res.redirect("/");
});
app.post("/income", function (req, res) {
    req.logout();
    res.redirect("/");
});
app.post("/charts", function (req, res) {
    req.logout();
    res.redirect("/");
});
app.post("/history", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/auth/google/tracker", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/signup", function (req, res) {

    User.register({ username: req.body.username, balance: 0, totalCredit: 0, totalDebit: 0 }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("signup");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("tracker");
            });
        }
    });

});




app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("signup");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("tracker");
            });
        }
    });

});


/*************tracker**************/

app.post("/addMoney", function (req, res) {

    const transaction = new transactions({
        flow: "Credit",
        userid: req.user.id,
        amount: req.body.income,
        category: req.body.category,
        mode: req.body.mode,
        note: req.body.note
    });

    transaction.save();

    User.findOneAndUpdate({ _id: req.user._id }, { $inc: { balance: req.body.income } }, function (err, data) {
        if (err) {
            console.log(err);
            req.redirect("income");
        }
        else {
            console.log(data);
        }
    });

    User.findOneAndUpdate({ _id: req.user._id }, { $inc: { totalCredit: req.body.income } }, function (err, data) {
        if (err) {
            console.log(err);
            req.redirect("income");
        }
        else {
            console.log(data);
        }
    });

    res.redirect("income");
});
app.post("/subMoney", function (req, res) {

    const transaction = new transactions({
        flow: "Debit",
        userid: req.user.id,
        amount: req.body.expense,
        category: req.body.category,
        mode: req.body.mode,
        note: req.body.note
    });

    transaction.save();

    User.findOneAndUpdate({ _id: req.user._id }, { $inc: { balance: -req.body.expense } }, function (err, data) {
        if (err) {
            console.log(err);
            req.redirect("income");
        }
        else {
            console.log(data);
        }
    });
    User.findOneAndUpdate({ _id: req.user._id }, { $inc: { totalDebit: req.body.expense } }, function (err, data) {
        if (err) {
            console.log(err);
            req.redirect("income");
        }
        else {
            console.log(data);
        }
    });

    res.redirect("income");
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server is running on port 3000");
});
// else if (req.body.username === "" || req.body.email === "" || req.body.password === "") {
//     res.redirect("signup");
// }