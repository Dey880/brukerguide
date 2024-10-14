const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.redirect('/?error=Du må logge inn for å se dette innholdet!');
      }
      req.user = user;
      next();
    });
  } else {
    res.redirect('/?error=Du må logge inn for å se dette innholdet!');
  }
};

module.exports = authenticateJWT;
