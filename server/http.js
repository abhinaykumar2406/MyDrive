import { open, readdir, stat, unlink, rename } from "fs/promises";
import http from "http";
import mime from "mime-types";
import path from "path";

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");

  if(req.method === "GET"){
    if (req.url === "/favicon.ico") return res.end("No favicon.");
    if (req.url === "/") {
      serveDirectory(req, res);
    } else {
      try {
        const [url, queryString] = req.url.split("?");
        const queryParam = {};
        queryString?.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");
          queryParam[key] = value;
        });
        console.log(queryParam);

        const stats = await stat(`./storage${decodeURIComponent(url)}`);
        if (stats.isDirectory()) {
          serveDirectory(req, res);
        } else {
          const fileHandle = await open(`./storage${decodeURIComponent(url)}`);
          const readStream = fileHandle.createReadStream();
          res.setHeader("Content-Type",mime.lookup(url) || "application/octet-stream");

          res.setHeader("Content-Length", stats.size);
          console.log(queryParam.action);
          if (queryParam.action === "download") {
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${url.slice(1)}"`
            );
          }
          else{
            res.setHeader("Content-Disposition", "inline");
          }
          readStream.pipe(res);
        }
      } catch (err) {
        console.log(err.message);
        res.end("Not Found!");
      }
    }
  }
  else if(req.method === "OPTIONS"){
    res.end("OK");
  }
  else if(req.method === "POST"){
    const filename = req.headers.filename;
    const filehandle = await open(`./storage/${filename}`,"w");
    const writestream = filehandle.createWriteStream();
    req.on("data",(chunk)=>{
      writestream.write(chunk);
    });
    req.on("end",()=>{
      filehandle.close();
      writestream.end();
      res.end("File Uploaded Successfully");
    });
  }
  else if(req.method === "DELETE"){
    req.on("data",async (chunk)=>{
      const filename = chunk.toString();
      console.log(filename);
      try {
        await unlink(`./storage/${filename}`);
        console.log("File deleted successfully");
      } catch (err) {
        console.error(err);
      }
    });
    res.end("DELETED");
  }
  else if(req.method==="PATCH"){
    const [url, queryString] = req.url.split("?");
    const queryParam = {};
    queryString?.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      queryParam[key] = value;
    });
    if(queryParam.action="rename"){
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end",async () => {
        const renameObj = JSON.parse(body);
        console.log(renameObj);
        const { oldname, newname } = renameObj;

        const oldPath = path.join("./storage", oldname);
        const newPath = path.join("./storage", newname);
        try {
          await rename(oldPath, newPath);
          console.log("Renamed successfully");
        }catch (err) {
          console.error(err);
        }
        res.end("Renamed Successfully")
      });
    }
  }
});

async function serveDirectory(req, res) {
  const [url] = req.url.split("?");
  const itemsList = await readdir(`./storage${url}`);
  const itemObj = [];
  for (const item of itemsList) {
    try{
      const itemStat = await stat(`./storage${url}/${item}`);
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

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(itemObj));
}

server.listen(4000, "127.0.0.1", () => {
  console.log("Server started");
});
