class Auth {
    validateKey(req, res, next) {
      try {
        if (req.method === "OPTIONS") {
          next();
          return;
        }
        const reqKey = req.headers["access-key"];
        if (process.env.ACCESS_KEY && reqKey && reqKey === process.env.ACCESS_KEY) {
          if (req.params?.isFrom) {
            return res.status(200).json({ msg: "success" });
          }
          else {
            next();
          }
        } else {
          return res.status(401).send("UNAUTHORIZED_ACCESS_KEY");
        }
      } catch (err) {
        return res.status(403).send("INVALID_ACCESS_KEY");
      }
    }
  }
  
  module.exports = new Auth();
  