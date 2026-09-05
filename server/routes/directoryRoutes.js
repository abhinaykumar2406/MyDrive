import express from "express"
import { readdir, stat, mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import directoriesDB from "../directoriesDB.json" with {type:"json"}
import filesDB from "../filesDB.json" with {type: "json"}

const router = express.Router();
const storageDir = path.join(import.meta.dirname, "..", "storage");
const fileDBPath = path.join(import.meta.dirname, "..", "filesDB.json");
const directoriesDBPath = path.join(import.meta.dirname, "..", "directoriesDB.json");

router.get("/",async (req,res)=>{

    // root = always first element
    const dirData = directoriesDB[0];
    const files = dirData.files.map((fileId)=>{
        return filesDB.find((file)=>file.id === fileId)
    });
    const dirs = dirData.dirs.map((dirId)=>{
        return directoriesDB.find((dir)=>dir.id === dirId)
    });
    res.json({...dirData,files,dirs});
});
router.get("/:id",async (req,res)=>{
    const {id} = req.params;
    const dirData = directoriesDB.find((dir)=> dir.id===id);
    const files = dirData.files.map((fileId)=>{
        return filesDB.find((file)=>file.id === fileId)
    });
    const dirs = dirData.dirs.map((dirId)=>{
        return directoriesDB.find((dir)=>dir.id === dirId)
    }).map(({id,name,parentDir})=>({id,name,parentDir}));
    res.json({...dirData,files,dirs});
});

router.post("/:dirname",async (req,res)=>{
    const {dirname} = req.params;
    let parentDirId = req.headers.parentdirid;
    if(!req.headers.parentdirid || req.headers.parentdirid==="undefined")
        parentDirId = directoriesDB[0].id;

    console.log("Header:", req.headers.parentdirid);
    console.log("Final parentDirId:", parentDirId);

    try{
        const id = crypto.randomUUID();
        directoriesDB.push({
            id,
            name:dirname,
            parentDir:parentDirId,
            files:[],
            dirs:[],
        });
        const dirData = directoriesDB.find((dir)=>dir.id===parentDirId);
        console.log(dirData);
        dirData.dirs.push(id);
        await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
        res.status(201).json({
            message: "Directory created successfully",
            id,
            name: dirname,
        });
    }
    catch(err){
        console.log(err);
        res.statusCode=500;
        res.status(500).json({
            error: "Failed to create Directory",
        });
    }
});

router.patch("/:id",async (req,res)=>{
    if(req.query.action === "rename"){
        try {
            const {id} = req.params;
            const {newname} = req.body;
            const dirData = directoriesDB.find((dir)=>dir.id === id);
            dirData.name = newname;
            await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
            console.log("Renamed successfully");
            res.statusCode(200).send("Renamed Successfully")
        }catch (err) {
            console.error(err);
            res.statusCode(500).send("Rename Failed");
        }
    }
});

router.delete("/:id",async(req,res)=>{
    try{
        const {id} = req.params;
        console.log(id);
        const dirIndex = directoriesDB.findIndex((dir)=> dir.id === id);
        console.log(dirIndex);
        const parentDirId = directoriesDB[dirIndex].parentDir;
        const parentDir = directoriesDB.find((dir)=> dir.id === parentDirId);
        parentDir.dirs.splice(parentDir.dirs.indexOf(id), 1);
        const dirCurrentDirData = directoriesDB[dirIndex];
        directoriesDB.splice(dirIndex,1);
        await Promise.all(
            dirCurrentDirData.files.map(async (fileId)=>{
                const fileIndex = filesDB.findIndex((file)=>file.id === fileId);
                const filename = `${fileId}${filesDB[fileIndex].extension}`;
                filesDB.splice(fileIndex,1);
                await unlink(path.join(storageDir, filename));
            }),
        );
        await writeFile(fileDBPath,JSON.stringify(filesDB)),
        await writeFile(directoriesDBPath,JSON.stringify(directoriesDB))
        console.log("File Deleted successfully");
        res.end("Deleted Successfully");
    }
    catch(err){
        res.send({error:err.message});
    }
});

export default router;