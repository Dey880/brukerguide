const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

// const Schema = mongoose.Schema();

mongoose
  .connect("mongodb://127.0.0.1:27017/helpdesk").then(() => {
    console.log("Mongodb connected!")
  }).catch((error) => {
    console.log("something happened");
  })

  const userschema =  new mongoose.Schema({
    email: String,
    password: String
  });


  const User = mongoose.model("User", userschema);
  

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  console.log("LOGGER UT HER", req.body);
});

app.get("/createuser", (req, res) => {
  res.render("createuser");
});

app.post("/createuser", async (req, res) => {
  console.log("LOGGER UT HER", req.body);
  const {login, password, repeatPassword} = req.body;

  if(password == repeatPassword){
    let newUser =  new  User({email:login, password:password})
    const result= await  newUser.save();

    console.log(result);

    if(result._id) {
      res.status(200).redirect("/login");
    }
  }
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/guide", (req, res) => {
  res.render("guide");
});

app.listen(process.env.PORT);
