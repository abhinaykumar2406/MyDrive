import usersDB from "./usersDB.json" with {type: "json"}


export default function checkAuth(req,res,next){
    const {uid,password} = req.cookies;
    if(!uid || !password){
        return res.status(401).json({message:"Unauthorized"});
    }
    const userIndex = usersDB.findIndex((user) => 
        user.id===uid && user.password===password
    );
    if(userIndex===-1){
        return res.status(401).json({message:"Unauthorized"});
    }
    req.user = usersDB[userIndex];
    next();
}