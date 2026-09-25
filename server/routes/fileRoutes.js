import express from "express"
import { open, unlink, rename, writeFile } from "fs/promises";
import path from "path";
import filesDB from "../filesDB.json" with {type: "json"}
import directoriesDB from "../directoriesDB.json" with {type:"json"}

const router = express.Router();
const storageDir = path.join(import.meta.dirname, "..", "storage");
const fileDBPath = path.join(import.meta.dirname, "..", "filesDB.json");
const directoriesDBPath = path.join(import.meta.dirname, "..", "directoriesDB.json");


router.get("/:id",(req,res,next)=>{
    try{
        const {id} = req.params;
        const fileData = filesDB.find((file)=>file.id === id);
        if(!fileData){
            return res.status(404).json({error:"File Not Found!"})
        }
        const parentDirId = fileData.parentDir;
        const parentDir = directoriesDB.find((dir)=>dir.id===parentDirId);
        if(parentDir.userId!=req.user.id){
            return res.status(401).json({message:"Unauthorized"});
        }
        const filename = `${id}${fileData.extension}`;
        if(req.query.action === "download"){
            res.set("Content-Disposition",`attachment; filename="${fileData.name}`);
        }
        return res.sendFile(path.join(storageDir,filename));
    }
    catch(err){
        err.status = 500;
        return next(err);
    }
});

router.delete("/:id",async (req,res,next)=>{
    try {
        const {id} = req.params;
        console.log(id);
        const fileIndex = filesDB.findIndex((file)=>file.id === id);
        if(fileIndex === -1){
            return res.status(404).json({message:"File Not Found!"});
        }
        console.log(fileIndex);
        const parentDirId = filesDB[fileIndex].parentDir;
        const parentDir = directoriesDB.find((dir)=>dir.id===parentDirId);
        if(parentDir.userId!=req.user.id){
            return res.status(401).json({message:"Unauthorized"});
        }
        const filename = `${id}${filesDB[fileIndex].extension}`;
        filesDB.splice(fileIndex,1);
        console.log(parentDirId);
        const dirIndex = directoriesDB.findIndex((dir)=>dir.id === parentDirId);
        console.log(dirIndex);
        directoriesDB[dirIndex].files = directoriesDB[dirIndex].files.filter(
            (fileId) => fileId !== id
        );
        await writeFile(fileDBPath,JSON.stringify(filesDB));
        await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
        await unlink(path.join(storageDir, filename));
        console.log("File deleted successfully");
        return res.end("Deleted Successfully");

    } catch (err) {
        console.error(err);
        return res.send("Delete failed");
    }
});

router.patch("/:id",async (req,res,next)=>{ 
    if(req.query.action==="rename"){
        try {
            const {id} = req.params;
            const {newname} = req.body;
            const fileData = filesDB.find((file)=>file.id === id);
            if(!fileData){
                return res.status(404).json({error:"File Not Found!"})
            }
            const parentDir = directoriesDB.find((dir)=>dir.id===fileData.parentDir);
            if(parentDir.userId!=req.user.id){
                return res.status(401).json({message:"Unauthorized"});
            }
            fileData.name = newname;
            await writeFile(fileDBPath,JSON.stringify(filesDB));
            console.log("Renamed successfully");
            return res.send("Renamed Successfully")
        }catch (err) {
            console.error(err);
            next(err);
        }
    }
    else{
        return res.send("Invalid query");
    }
});

router.post("/:filename",async (req,res,next)=>{
    try{
        const {filename} = req.params;
        if(!filename || filename==="undefined")
            filename = "Untitled";
        const parentDirId = req.headers.parentdirid || req.user.rootDirId;
        const parentDir = directoriesDB.find((dir)=>dir.id===parentDirId);
        if(parentDir.userId!=req.user.id){
            return res.status(401).json({message:"Unauthorized"});
        }
        const id = crypto.randomUUID();
        const extension = path.extname(filename);
        const fullFilename = `${id}${extension}`
        const filehandle = await open(path.join(storageDir, fullFilename),"w");
        const writestream = filehandle.createWriteStream();
        req.pipe(writestream);
        writestream.on("finish", async () => {
            await filehandle.close();
            filesDB.push({
                name:filename,
                id,
                extension,
                parentDir:parentDirId
            });
            const dirData = directoriesDB.find((dir)=>dir.id === parentDirId);
            dirData.files.push(id);
            await writeFile(fileDBPath,JSON.stringify(filesDB));
            await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
            return res.status(201).send("File Uploaded Successfully");
        });
        req.on("end",()=>{
          writestream.end();
        });
    }
    catch(err){
        next(err);
    }
});

export default router;