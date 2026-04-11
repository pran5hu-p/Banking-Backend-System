const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model.js');
const blacklistModel = require('../models/blackList.model.js')

async function authMiddleware(req, res, next){
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({message: "Unauthorized: No token provided"});
    }

    const blacklisted = await blacklistModel.findOne({token});

    if(blacklisted){
        return res.status(401).json({message: "Unauthorized: Token has been blacklisted"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);
        req.user = user;
        return next();
    }catch(err){
        return res.status(401).json({message: "Unauthorized: Invalid token"});
    }
}

async function systemAuthMiddleware(req, res, next){
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({message: "Unauthorized: No token provided"});
    }

    const blacklisted = await blacklistModel.findOne({token});

    if(blacklisted){
        return res.status(401).json({message: "Unauthorized: Token has been blacklisted"});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId).select("+systemUser");
        if(!user.systemUser){
            return res.status(403).json({message: "Forbidden: Only system users can perform this action"});
        }
        req.user = user;
        return next();
    }catch(err){
        return res.status(401).json({message: "Unauthorized: Invalid token"});
    }
}

module.exports = {
    authMiddleware,
    systemAuthMiddleware
};