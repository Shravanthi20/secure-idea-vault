const ACL= require("../models/ACL");
exports.grantAccess= async (req,res)=>{
    const {userId, ideaId, permission}= req.body;
    await ACL.create({
        subjectId:userId,
        objectId:ideaId,
        permission
    });
    res.send("Access granted");
};