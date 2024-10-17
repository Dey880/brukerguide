const mongoose = require("mongoose");
const BrukerGuide = require("./brukerGuide");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.pre("findOneAndDelete", async function(next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (user) {
      await BrukerGuide.deleteMany({ author: user.email });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;