const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.get("/",function (req,res) {
    res.sendFile(__dirname + "/home.html");
});

app.get("/login", function (req,res) {
    res.sendFile(__dirname + "/login.html");
});

app.get("/signup", function (req,res) {
    res.sendFile(__dirname + "/signup.html");
});

// app.post("/", function (req,res){
//     console.log(req.body);
//     if (req.body.name=="login") {
//         res.redirect("login");
//     }
//     else{
//         res.redirect("signup");
//     }
// });

app.listen(3000,function () {
    console.log("Server is running on port 3000");
});