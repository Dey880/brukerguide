const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.redirect('/?error=You need to log in to view this content');
      }
      req.user = user;
      next();
    });
  } else {
    res.redirect('/?error=You need to log in to view this content');
  }
};

module.exports = authenticateJWT;
