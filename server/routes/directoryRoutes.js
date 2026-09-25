import express from "express"
import {unlink, writeFile } from "fs/promises";
import path from "path";
import directoriesDB from "../directoriesDB.json" with {type:"json"}
import filesDB from "../filesDB.json" with {type: "json"}

const router = express.Router();
const storageDir = path.join(import.meta.dirname, "..", "storage");
const fileDBPath = path.join(import.meta.dirname, "..", "filesDB.json");
const directoriesDBPath = path.join(import.meta.dirname, "..", "directoriesDB.json");

router.get("/",async (req,res,next)=>{
    const user = req.user;
    try{
        const dirData = user.rootDirId;
        const files = dirData.files.map((fileId)=>{
            return filesDB.find((file)=>file.id === fileId)
        });
        const dirs = dirData.dirs.map((dirId)=>{
            return directoriesDB.find((dir)=>dir.id === dirId)
        });
        return res.json({...dirData,files,dirs});
    }
    catch(err){
        next(err);
    }
});
router.get("/:id",async (req,res,next)=>{
    const {uid} = req.cookies;
    try{
        const id = req.params.id;
        const dirData = directoriesDB.find((dir)=> dir.id===id);
        if(!dirData){
            return res.status(404).json({message:"Directory Not Found!"});
        }
        if(dirData.userId!=uid){
            return res.status(401).json({message:"Unauthorized"});
        }
        const files = dirData.files.map((fileId)=>{
            return filesDB.find((file)=>file.id === fileId)
        });
        const dirs = dirData.dirs.map((dirId)=>{
            return directoriesDB.find((dir)=>dir.id === dirId)
        }).map(({id,name,parentDir})=>({id,name,parentDir}));
        return res.json({...dirData,files,dirs});
    }
    catch(err){
        next(err);
    }
});

router.post("/:dirname",async (req,res,next)=>{
    const {uid} = req.cookies;
    const dirname = req.params.dirname || "New Folder";
    let parentDirId = req.headers.parentdirid;
    const user = req.user;
    if(!req.headers.parentdirid || req.headers.parentdirid==="undefined")
        parentDirId=user.rootDirId;

    console.log("Header:", req.headers.parentdirid);
    console.log("Final parentDirId:", parentDirId);

    try{
        const dirData = directoriesDB.find((dir)=>dir.id===parentDirId);
        if(!dirData){
            return res.status(404).json({message:"Parent Directory Not Found!"});
        }
        if(dirData.userId!=uid){
            return res.status(401).json({message:"Unauthorized!"});
        }
        const id = crypto.randomUUID();
        directoriesDB.push({
            id,
            userId:uid,
            name:dirname,
            parentDir:parentDirId,
            files:[],
            dirs:[],
        });
        console.log(dirData);
        dirData.dirs.push(id);
        await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
        return res.status(201).json({
            message: "Directory created successfully",
            id,
            name: dirname,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            error: "Failed to create Directory",
        });
    }
});

router.patch("/:id",async (req,res,next)=>{
    const {uid} = req.cookies;
    if(req.query.action === "rename"){
        try {
            const {id} = req.params;
            const {newname} = req.body;
            const dirData = directoriesDB.find((dir)=>dir.id === id);
            if(!dirData){
                return res.status(404).json({message:"Directory Not Found!"});
            }
            if(dirData.userId!=uid){
                return res.status(401).json({message:"Unauthorized"});
            }
            dirData.name = newname;
            await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
            console.log("Renamed successfully");
            res.statusCode(200).send("Renamed Successfully")
        }catch (err) {
            console.error(err);
            err.status = 500;
            next(err);
        }
    }else{
        return res.status(400).json({message: "Invalid action query"})
    }
});

const deleteDirectory = (async (id,uid)=>{
    console.log(id);
    if (id === "root") {
        throw new Error("Root directory cannot be deleted");
    }
    const dirIndex = directoriesDB.findIndex((dir)=> dir.id === id);
    console.log(dirIndex);
    if (dirIndex === -1) {
        throw new Error("Directory not found");
    }
    if(directoriesDB[dirIndex].userId!=uid){
        return res.status(401).json({message:"Unauthorized"});
    }
    const parentDirId = directoriesDB[dirIndex].parentDir;
    const parentDir = directoriesDB.find((dir)=> dir.id === parentDirId);
    const dirCurrentDirData = directoriesDB[dirIndex];
    await Promise.all([
        ...dirCurrentDirData.files.map(async (fileId)=>{
            const fileIndex = filesDB.findIndex((file)=>file.id === fileId);
            const filename = `${fileId}${filesDB[fileIndex].extension}`;
            await unlink(path.join(storageDir, filename));
            filesDB.splice(fileIndex,1);
        }),
        ...dirCurrentDirData.dirs.map(async (dirId)=>{
            await deleteDirectory(dirId);
        }),
    ]);
    parentDir.dirs.splice(parentDir.dirs.indexOf(id), 1);
    directoriesDB.splice(dirIndex,1);
});

router.delete("/:id",async(req,res,next)=>{
    const {uid} = req.cookies;
    try{
        const {id} = req.params;
        await deleteDirectory(id,uid);
        await writeFile(fileDBPath,JSON.stringify(filesDB));
        await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
        console.log("File Deleted successfully");
        res.end("Deleted Successfully");
    }
    catch(err){
        next(err);
    }
});

export default router;