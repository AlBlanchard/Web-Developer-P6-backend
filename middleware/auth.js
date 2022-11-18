const jwt = require('jsonwebtoken');
require('dotenv').config();

const tokenSecret = process.env.SECRET_TOKEN
 
module.exports = (req, res, next) => {
   try {
       const token = req.headers.authorization.split(' ')[1];
       const decodedToken = jwt.verify(token, tokenSecret);
       const userId = decodedToken.userId;
       req.auth = {
           userId: userId
       };
    next();
   } catch(error) {
       res.status(401).json({ error });
   }
};