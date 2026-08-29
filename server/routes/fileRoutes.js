import express from "express"
import { open, unlink, rename } from "fs/promises";
import path from "path";

const router = express.Router();
const storageDir = path.join(import.meta.dirname, "..", "storage");


router.get("{/*filename}",(req,res,next)=>{
    try{
        const {filename} = req.params;
        const file = filename.join("/");
        const filepath = path.join("/",file);
        if(req.query.action === "download"){
            res.set("Content-Disposition","attachment");
        }
        res.sendFile(path.join(storageDir,filepath));
    }
    catch(err){
        res.send({error:err.message});
    }
});

router.delete("{/*filename}",async (req,res,next)=>{
    const {filename} = req.params;
    const file = filename.join("/");
    const filepath = path.join("/",file);
    try {
        await unlink(path.join(storageDir, filepath));
        console.log("File deleted successfully");
        res.end("DELETED");

    } catch (err) {
        console.error(err);
        res.send("Delete failed");
    }
});

router.patch("{/*filename}",async (req,res,next)=>{
    if(req.query.action==="rename"){
        const {filename} = req.params;
        const file = filename.join("/");
        const filepath = path.join("/",file);
        const {newname} = req.body;
        const oldPath = path.join(storageDir, filepath);
        const newPath = path.join(storageDir, newname);
        try {
            await rename(oldPath, newPath);
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

router.post("{/*filename}",async (req,res)=>{
    try{
        const {filename} = req.params;
        const file = filename.join("/");
        const filepath = path.join("/",file);
        const filehandle = await open(path.join(storageDir, file),"w");
        const writestream = filehandle.createWriteStream();
        req.pipe(writestream);
        writestream.on("finish", async () => {
            await filehandle.close();
            res.send("File Uploaded Successfully");
        });
        req.on("end",()=>{
          writestream.end();
          res.send("File Uploaded Successfully");
        });
    }
    catch(err){
        res.send({error:err.message});
    }
});

export default router;