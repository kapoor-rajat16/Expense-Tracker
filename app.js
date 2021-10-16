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
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admit-rajat:Test123@cluster0.uzkn9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", { useNewUrlParser: true });

var imageSchema = new mongoose.Schema({
    userid: String,
    name:String,
    desc: String,
    img:
    {
       type:String
    }
});

const image = mongoose.model('Image', imageSchema);

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/uploads/')
    },
    filename: function(req, file, cb){
        // let ext = path.extname(file.originalname)
        cb(null, Date.now() + file.originalname)
    }
});
  
// upload parameters for molter

var upload = multer({
    storage: storage,
    // fileFilter: function (req,file,callback) {
    //     if (
    //         file.mimetype == 'image/png' ||
    //         file.mimetype == 'image/jpg'
    //     ) {
    //         callback(null,true)
    //     } else{
    //         console.log('only jpg & png file supported!');
    //         callback(null,false)
    //     }
    // },
    limits:{
        fileSize:1024 * 1024 * 3
    }
    });

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
    },
    year:{
        type:String
    },
    month:{
        type:String
    },
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
    totalDebit: Number,
    xsavings:{
        type:Number,
        default:0
    },
    xincome:{
        type:Number,
        default:0
    },
    xgrocery:{
        type:Number,
        default:0
    },
    xtranspartation:{
        type:Number,
        default:0
    },
    xeducation:{
        type:Number,
        default:0
    },
    xother:{
        type:Number,
        default:0
    },
    xexpense:{
        type:Number,
        default:0
    }
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
        res.render("charts",{User:req.user})
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

app.get("/target", function (req,res) { 
    if (req.isAuthenticated()) {
        res.render("target",{User:req.user});
    }
    else {
        res.redirect("login");
    }
});

app.get('/uploadRecipts', (req, res) => {
    // image.find({}, (err, items) => {
    //     if (err) {
    //         console.log(err);
    //         res.status(500).send('An error occurred', err);
    //     }
    //     else {
    //         res.render('uploadRecipts', { items: items,User:req.user });
    //     }
    // });

    if (req.isAuthenticated()) {
        image.find()
            .exec()
            .then(items => res.render("uploadRecipts", { items: items, User: req.user }))
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


app.post("/addMoney", function (req, res) {

    const transaction = new transactions({
        flow: "Credit",
        userid: req.user.id,
        amount: req.body.income,
        category: req.body.category,
        mode: req.body.mode,
        note: req.body.note,
        year: new Date().getFullYear(),
        month:new Date().getMonth()
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
        note: req.body.note,
        year: new Date().getFullYear(),
        month:new Date().getMonth()
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
            res.redirect("income");
        }
        else {
            console.log(data);
        }
    });
    res.redirect("income");

});

app.post("/setTarget",function (req,res) {
    let expectedExpense = Number(req.body.TGroceryExpense)+Number(req.body.TTransportationExpense)+Number(req.body.TEducationExpense)+Number(req.body.TOtherExpense);
    let TSavings = Number(req.body.ProjectedIncome)-Number(req.body.TGroceryExpense)-Number(req.body.TTransportationExpense)-Number(req.body.TEducationExpense)-Number(req.body.TOtherExpense);
    User.findOneAndUpdate({_id:req.user._id},{xincome:req.body.ProjectedIncome,xgrocery:req.body.TGroceryExpense,xtranspartation:req.body.TTransportationExpense,xeducation:req.body.TEducationExpense,xother:req.body.TOtherExpense,xsavings:TSavings,xexpense:expectedExpense},function (err,data) {
        
        if (err) {
            console.log(err);
            res.redirect("target");
        }
        else{
            res.redirect("target");
        }
    });
});


app.post('/uploadRecipts', upload.single('image'), async(req,res) => {
  
    console.log(req.file);
    let obj = new image({
        userid:req.user._id,
        name: req.body.imgtitle,
        desc: req.body.desc,
        // img: {
        //     data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        //     contentType: 'image/png'
        // }
        img:req.file.filename
    });

    try{
        obj = await obj.save();
        res.redirect('uploadRecipts');
    } catch(error){
        console.log(error);
    }
    
});

function downloadHistory() {
    console.log("initiated");
    const element = document.getElementById("transactionHistory");
    html2pdf()
    .from(element)
    .save();
}
    


app.listen(process.env.PORT || 3000, function () {
    console.log("Server is running on port 3000");
});
// else if (req.body.username === "" || req.body.email === "" || req.body.password === "") {
//     res.redirect("signup");
// }