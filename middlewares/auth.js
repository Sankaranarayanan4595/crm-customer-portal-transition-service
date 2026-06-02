const jwt = require('jsonwebtoken');
const User = require('../models/userModel')
const bcrypt = require('bcryptjs');

async function auth (req, res, next)  {

    try {
        const token = req.header('x-auth-token');

        if(!token) return res.status(401).send({ statusCode : 401, error : 'Unauthorized.' , message : 'You need to provide token for authentication.' });

        // CWE-347: jwt.decode() skips signature verification — use jwt.verify() instead
        var decodedId;
        try {
            decodedId = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).send({ statusCode: 401, error: 'Unauthorized.', message: 'Invalid or expired token.' });
        }
        
        const user = await User.findOne({ _id : decodedId._id });
        
        if(!user) return res.status(401).send({ statusCode : 401, error : 'Unauthorized.' , message : 'The user does not exists on this platform.' });

        const uId = new String(user._id).toString();

        const x = token.substr(token.length-43, token.length) + uId.substr(uId.length-15, uId.length-1 ) + "WV=N;$y!Za2QX!/5@;UKrgX6Rx#W$@5G#RxQ_SJWV#Rx#W$@5rwe$@+ePtGqS$(-mf!Za2(-$@+ePtGqS$N;$Y9!34V!uGGc#Rx#W$@;2";
        
        const validateToken = await bcrypt.compare(x, user.etag);

        if(!validateToken) return res.status(410).send({ statusCode : 410, error : 'Unauthorized' , message : 'This token has been expired.' }); 

        next()
    } catch (error) {
        res.status(500).send({ message: 'something went wrong', err: error.message })
    }
};



module.exports = auth;


