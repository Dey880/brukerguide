const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer")
const path = require("path")



mongoose
  .connect("mongodb://127.0.0.1:27017/helpdesk").then(() => {
    console.log("Mongodb connected!")
  }).catch((error) => {
    console.log("something happened", error);
  })


// const uploads = multer({ dest: "uploads/"});
const diskStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads")
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    console.log("EXT", ext)
    // if(ext !== ".png" && ext !== ".jpg") {
    //   return cb(new Error("Only .PNG files allowed"))
    // }

    console.log(file, "BASE");
    // const fileName = file.originalname + ".png"
    const fileName = file.originalname
    cb(null, fileName)

  }
})


const uploads = multer({
  storage: diskStorage
})

const userschema =  new mongoose.Schema({
  email: String,
  password: String
});

const brukerSchema = new mongoose.Schema({
  tittel: String,
  tag: String,
  overskrift: Array,
  beskrivelse: Array,
  bilde: Array
})

const BrukerGuide = mongoose.model("BrukerGuide", brukerSchema)
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

app.get("/nyGuide", (req, res) => {
  res.render("nyGuide")
});

app.post("/nyGuide", uploads.any(), async (req, res) => {
  console.log("BODY", req.body)
  console.log("FILES", req.files)

  const { tittel, tag, overskrift, beskrivelse } = req.body;

  const overskriftArray = Array.isArray(overskrift) ? overskrift : [overskrift];
  const beskrivelseArray = Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse];

  const bildeArray = req.files.map(file => file.path);

  
  const newBrukerGuide = new BrukerGuide({ 
    tittel, 
    tag,
    overskrift: overskriftArray, 
    beskrivelse: beskrivelseArray,
    bilde: bildeArray
  });

  const result = await newBrukerGuide.save();
  res.status(200).redirect("/dashboard");
});

app.listen(process.env.PORT);