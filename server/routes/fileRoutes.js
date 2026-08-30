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
        const filename = `${id}${fileData.extension}`;
        if(req.query.action === "download"){
            res.set("Content-Disposition","attachment");
        }
        res.sendFile(path.join(storageDir,filename));
    }
    catch(err){
        res.send({error:err.message});
    }
});

router.delete("/:id",async (req,res,next)=>{
    try {
        const {id} = req.params;
        const fileIndex = filesDB.findIndex((file)=>file.id === id);
        console.log(fileIndex);
        const parentDir = filesDB[fileIndex].parentDir;
        const filename = `${id}${filesDB[fileIndex].extension}`;
        filesDB.splice(fileIndex,1);
        console.log(parentDir);
        const dirIndex = directoriesDB.findIndex((dir)=>dir.id === parentDir);
        console.log(dirIndex);
        directoriesDB[dirIndex].files = directoriesDB[dirIndex].files.filter(
            (fileId) => fileId !== id
        );
        await writeFile(fileDBPath,JSON.stringify(filesDB));
        await writeFile(directoriesDBPath,JSON.stringify(directoriesDB));
        await unlink(path.join(storageDir, filename));
        console.log("File deleted successfully");
        res.end("Deleted Successfully");

    } catch (err) {
        console.error(err);
        res.send("Delete failed");
    }
});

router.patch("/:id",async (req,res,next)=>{
    if(req.query.action==="rename"){
        try {
            const {id} = req.params;
            const {newname} = req.body;
            const fileData = filesDB.find((file)=>file.id === id);
            fileData.name = newname;
            await writeFile(fileDBPath,JSON.stringify(filesDB));
            console.log("Renamed successfully");
            res.send("Renamed Successfully")
        }catch (err) {
            console.error(err);
            res.send("Rename Failed");
        }
    }
    else{
        res.send("Invalid query");
    }
});

router.post("/:filename",async (req,res)=>{
    try{
        const {filename} = req.params;
        const parentDirId = req.headers.parentdirid || directoriesDB[0].id;
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
            res.send("File Uploaded Successfully");
        });
        req.on("end",()=>{
          writestream.end();
        });
    }
    catch(err){
        res.send({error:err.message});
    }
});

export default router;