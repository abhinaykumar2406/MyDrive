import express from "express"
import { writeFile } from "fs/promises";
import path from "path";
import directoriesDB from "../directoriesDB.json" with {type:"json"}
import usersDB from "../usersDB.json" with {type:"json"}

const router = express.Router();
const usersDBPath = path.join(import.meta.dirname, "..", "usersDB.json");
const directoriesDBPath = path.join(import.meta.dirname, "..", "directoriesDB.json");

router.post("/",async (req ,res, next)=>{
    const userId = crypto.randomUUID();
    const rootDirId = `root-${userId}`;
    const {name, email, password} = req.body;
    const foundUser = usersDB.find((user) => user.email===email);
    if(foundUser){
        return res.status(409).json({
            error:"User already exists",
            message:"A user with this email already exists, please try logging with this email"
        });
    }
    usersDB.push({
        id:userId,
        name,
        email,
        password,
        rootDirId
    });
    directoriesDB.push({
        id:rootDirId,
        name:`root-${email}`,
        userId,
        parentDir:null,
        files:[],
        dirs:[]
    });
    try{
        await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
        await writeFile(usersDBPath,JSON.stringify(usersDB));
        res.status(201).json({message:"Registration Successful"})
    }
    catch(err){
        next(err);
    }
});

router.post("/login",async (req,res,next)=>{
    const {email, password} = req.body;
    const userIndex = usersDB.findIndex((user) => 
        user.email===email && user.password===password
    );
    if(userIndex===-1){
        return res.status(404).json({message:"Invalid Email or Password"});
    }
    console.log("Hi");
    return res.status(200).json({
        message:"Login Successful",
        rootDirId:usersDB[userIndex].rootDirId
    });
});

export default router;