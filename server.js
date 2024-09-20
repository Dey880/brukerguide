const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


mongoose
  .connect("mongodb://127.0.0.1:27017/helpdesk").then(() => {
    console.log("Mongodb connected!")
  }).catch((error) => {
    console.log("something happened", error);
  })

const userschema =  new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userschema);

const saltRounds = 10;

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
  // console.log("LOGGER UT HER", req.body);  // LOGS PASSWORDS
  const { brukernavn, password } = req.body;

  User.findOne({email:brukernavn}).then((user) => {
    console.log("resultat", user)

    bcrypt.compare(password, user.password).then((result) => {
      if(result) {
        res.status(200).redirect("/dashboard")
      }
    })

    if(user.password == password) {
      res.status()
    }
  }).catch((error) => {
    console.log("Error", error)
    res.status(500).json({message:'Ikke gyldig passord, prøv igjen.'});
  })

});

app.get("/createuser", (req, res) => {
  res.render("createuser");
});

app.post("/createuser", async (req, res) => {
  // console.log("LOGGER UT HER", req.body); // LOGS PASSWORDS
  const {brukernavn, password, repeatPassword} = req.body;

  if(password == repeatPassword){

    bcrypt.hash(password, saltRounds, async function(error, hash) {

      let newUser =  new  User({email:brukernavn, password:hash})
      const result= await  newUser.save();
  
      console.log(result);
  
      if(result._id) {
        res.status(200).redirect("/login");
      }
    })
  } else {
    res.status(500).json({message:"Passord stemmer ikke overens"})
  }
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/guide", (req, res) => {
  res.render("guide");
});

app.listen(process.env.PORT);
