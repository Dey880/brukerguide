const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer")
const path = require("path")
const session = require("express-session")


mongoose
.connect("mongodb://127.0.0.1:27017/helpdesk").then(() => {
  console.log("Mongodb connected!")
}).catch((error) => {
  console.log("something happened", error);
})


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
author: String,
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
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.get("/", async (req, res) => {
  try {
    const searchQuery = req.query.search || "";  // Get the search query from the URL
    const guides = await BrukerGuide.find({
      tag: { $regex: searchQuery, $options: "i" }  // Search by title (case-insensitive)
    });
    res.render("index", { guides, searchQuery });  // Pass the guides and search query to index.ejs
  } catch (error) {
    console.error("Error fetching guides", error);
    res.status(500).send("Error fetching guides");
  }
});



app.get("/login", (req, res) => {
res.render("login");
});

app.post("/login", (req, res) => {
// console.log("LOGGER UT HER", req.body);  // LOGS PASSWORDS
const { brukernavn, password } = req.body;

User.findOne({email:brukernavn}).then((user) => {
  if (!user) {
    return res.status(400).json({ message: "User not found"})
  }
  console.log("resultat", user)

  bcrypt.compare(password, user.password).then((result) => {
    if(result) {
      req.session.currentUser = brukernavn;
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

app.get("/guide/:id?", async (req, res) => {
  try {
    const guides = req.params.id 
      ? [await BrukerGuide.findById(req.params.id)]  // If ID is provided, fetch only that guide
      : await BrukerGuide.find();  // Otherwise, fetch all guides

    if (!guides || guides.length === 0 || !guides[0]) {
      res.render("guide", { guides: [] });  // Pass an empty array to the guide.ejs page
    } else {
      res.render("guide", { guides });  // Pass the fetched guides to the view
    }
  } catch (error) {
    console.error("Error fetching guides", error);
    res.status(500).send("Error fetching guides");
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

  const newBrukerGuide = new BrukerGuide({
    author: req.session.currentUser,
    tittel, 
    tag,
    overskrift: overskriftArray, 
    beskrivelse: beskrivelseArray,
    bilde: bildeArray, 
  });

  const result = await newBrukerGuide.save();
  res.status(200).redirect("/guide");
} catch (error) {
  res.status(400).json({ message: error.message });
}
});

app.get("/editGuide/:id", async (req, res) => {
  try {
    const guide = await BrukerGuide.findById(req.params.id);
    if (!guide) {
      return res.status(404).send("Guide not found");
    }
    res.render("editGuide", { guide });
  } catch (error) {
    console.error("Error fetching guide for editing", error);
    res.status(500).send("Error fetching guide");
  }
});

app.post("/editGuide/:id", uploads.any(), async (req, res) => {
  try {
    const { tittel, tag, overskrift, beskrivelse } = req.body;
    const overskriftArray = Array.isArray(overskrift) ? overskrift : [overskrift];
    const beskrivelseArray = Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse];
    const bildeArray = req.files ? req.files.map(file => file.path.replace("public", "")) : [];

    const updatedGuide = await BrukerGuide.findByIdAndUpdate(req.params.id, {
      tittel,
      tittel,
      tag,
      overskrift: overskriftArray,
      beskrivelse: beskrivelseArray,
      bilde: bildeArray,
    }, { new:true });

    if (!updatedGuide) {
      return res.statud(404).send("Guide not found")
    }
    res.status(200).redirect("/guide");
  } catch (error) {
    console.error("Error updating guide", error)
    res.status(400).json({ message: error.message })
  }
});

app.listen(process.env.PORT);