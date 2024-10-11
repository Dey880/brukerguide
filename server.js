const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// HELP
mongoose
.connect("mongodb://localhost:27017/helpdesk").then(() => {}).catch((error) => {
  console.log("something happened", error);
})


const diskStorage = multer.diskStorage({
destination: function(req, file, cb) {
  cb(null, "./public/uploads")
},
filename: function(req, file, cb) {
  const ext = path.extname(file.originalname);
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
app.use(cookieParser());

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get("/", async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const searchType = req.query.searchType || "tag";

    const query = {};
    if (searchType == "tag") {
      query.tag = { $regex: searchQuery, $options: "i" };
    } else if (searchType === "title") {
      query.tittel = { $regex: searchQuery, $options: "i" };
    }

    const guides = await BrukerGuide.find(query);
    res.render("index", { guides, searchQuery, searchType });
  } catch (error) {
    console.error("Error fetching guides", error);
    res.status(500).send("Error fetching guides");
  }
});



app.get("/login", (req, res) => {
res.render("login");
});

app.post("/login", (req, res) => {
const { brukernavn, password } = req.body;

User.findOne({email:brukernavn})
  .then((user) => {
    if (!user) {
      return res.status(400).json({ message: "User not found"})
    }

  bcrypt.compare(password, user.password).then((result) => {
    if(result) {
      const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        maxAge: 3600000,
      });
      return res.status(200).redirect("/dashboard");
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  });
})
.catch((error) => {
  res.status(500).json({message:'Ikke gyldig passord, prøv igjen.'});
});

});

app.get("/createuser", (req, res) => {
res.render("createuser");
});

app.post("/createuser", async (req, res) => {
const {brukernavn, password, repeatPassword} = req.body;

if(password == repeatPassword){
  bcrypt.hash(password, saltRounds, async function(error, hash) {
    let newUser =  new  User({email:brukernavn, password:hash})
    const result= await  newUser.save();

    if(result._id) {
      const token = jwt.sign({ userId : result._id, email:result.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
      
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        maxAge: 3600000,
      });

      res.status(200).redirect("/login");
    }
  });
} else {
  res.status(500).json({message:"Passord stemmer ikke overens"})
}
});

app.get("/dashboard", authenticateJWT, async (req, res) => {
  try {
    const guides = await BrukerGuide.find({ author: req.user.email});
    res.render("dashboard", { user: req.user, guides })
  } catch (error) {
    console.error("Error fetching guides", error);
    res.status(500).send("Error fetching guides");
  }
});

app.get("/guide/:id?", authenticateJWT, async (req, res) => {
  try {
    const guides = req.params.id 
      ? [await BrukerGuide.findById(req.params.id)]
      : await BrukerGuide.find();

    if (!guides || guides.length === 0 || !guides[0]) {
      res.render("guide", { guides: [], user: req.user || null });
    } else {
      res.render("guide", { guides, user: req.user || null });
    }
  } catch (error) {
    console.error("Error fetching guides", error);
    res.status(500).send("Error fetching guides");
  }
});



app.get("/nyGuide", (req, res) => {
res.render("nyGuide")
});

app.post("/nyGuide", uploads.any(), authenticateJWT, async (req, res) => {
  try {
    const { tittel, tag, overskrift, beskrivelse } = req.body;

    const overskriftArray = Array.isArray(overskrift) ? overskrift : [overskrift];
    const beskrivelseArray = Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse];
    const bildeArray = req.files.map(file => file.path.replace("public", ""));

    const authorEmail = req.user.email;

    const newBrukerGuide = new BrukerGuide({
      author: authorEmail,
      tittel, 
      tag,
      overskrift: overskriftArray, 
      beskrivelse: beskrivelseArray,
      bilde: bildeArray, 
    });

    const result = await newBrukerGuide.save();

    res.status(200).redirect(`/guide/${result._id}`);
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

app.delete("/deleteGuide/:id", authenticateJWT, async (req, res) => {
  try {
      const guideId = req.params.id.trim(); // Trim spaces
      const deletedGuide = await BrukerGuide.findByIdAndDelete(guideId);
      
      if (!deletedGuide) {
          return res.status(404).send("Guide not found");
      }
      
      res.status(200).json({ message: "Guide deleted successfully", deletedGuide });
  } catch (error) {
      console.error("Error deleting guide", error);
      res.status(500).json({ message: "Error deleting guide" });
  }
});

app.listen(process.env.PORT);