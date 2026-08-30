import express from "express"
import { readdir, stat, mkdir } from "fs/promises";
import path from "path";
import directoriesDB from "../directoriesDB.json" with {type:"json"}
import filesDB from "../filesDB.json" with {type: "json"}

const router = express.Router();
const storageDir = path.join(import.meta.dirname, "..", "storage");

const getDirectoryResponse = (async (itemList,dir)=>{
    const itemObj = [];
    for (const item of itemList) {
        try{
            const itemStat = await stat(path.join(storageDir,`${dir ? `${dir}/` : ''}${item}`));
            itemObj.push({
                name: item,
                isFile: itemStat.isFile(),
                isDirectory: itemStat.isDirectory(),
            });
        }
        catch(err){
            console.log(err);
        }
    }
    return itemObj;
});

router.get("/",async (req,res)=>{
    const {id} = req.params;
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
    res.json(dirData);
});

router.get("{/*dirname}",async (req,res)=>{
    const {dirname} = req.params;
    try{
        const dirpath = dirname.join("/");
        const dir = path.join("/",dirpath);
        const itemList = await readdir(path.join(storageDir,`${dir}`));
        const itemObj = await getDirectoryResponse(itemList,dir);
        res.json(itemObj);
    }
    catch(err){
        res.json({error:err.message});
    }
});

router.post("{/*dirname}",async (req,res)=>{
    const {dirname} = req.params;
    const dirpath = dirname.join("/");
    const dir = path.join("/",dirpath);
    try{
        
        await mkdir(path.join(storageDir,`${dir}`));
        res.status(201).json({
            result: "Folder created successfully",
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

export default router;