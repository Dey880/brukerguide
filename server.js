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
    cb(null, "./public/uploads")
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    console.log("EXT", ext)
    console.log(file, "BASE");
    const fileName = file.originalname
    cb(null, fileName)

  }
})


const uploads = multer({
  storage: diskStorage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only .png .jpg and .jpeg format allowed"));
    }
    cb(null, true);
  }
});

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
app.use(express.static("uploads"));
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

app.get("/dashboard", async (req, res) => {
  try {
    const guides = await BrukerGuide.find();
    res.render("dashboard", { guides });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).send("Internal Server Error")
  }
});

app.get("/guide:id", async (req, res) => {
  try {
    const guideId = req.params.id;
    const guide = await BrukerGuide.findById(guideId);

    if (!guide) {
      return res.status(404).send("Guide not found");
    }

    res.render("guide", { guide });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/nyGuide", (req, res) => {
  res.render("nyGuide")
});

app.post("/nyGuide", uploads.any(), async (req, res) => {
  try {

    console.log("BODY", req.body)
    console.log("FILES", req.files)
    
    const { tittel, tag, overskrift, beskrivelse } = req.body;
    
    const overskriftArray = Array.isArray(overskrift) ? overskrift : [overskrift];
    const beskrivelseArray = Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse];

    const bildeArray = req.files.map(file => file.path.replace("public", ""));
console.log(bildeArray, req.files);
    
    const newBrukerGuide = new BrukerGuide({ 
      tittel, 
      tag,
      overskrift: overskriftArray, 
      beskrivelse: beskrivelseArray,
      bilde: bildeArray
    });

    const result = await newBrukerGuide.save();
    res.status(200).redirect("/guide");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
  });

app.listen(process.env.PORT);