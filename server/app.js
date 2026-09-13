import express from "express"
import cors from "cors";
import fileRoutes from "./routes/fileRoutes.js"
import directoryRoutes from "./routes/directoryRoutes.js"
import userRoutes from "./routes/userRoutes.js"

const app = express();
app.use(express.json());
app.use(cors());
app.use("/directory",directoryRoutes);
app.use("/file",fileRoutes);
app.use("/user",userRoutes);

app.use((err,req,res,next)=>{
    res.status(err.status || 500).json({message:"Something went wrong on Server \n Please refresh or Try again later"})
});
app.listen(4000, "127.0.0.1", () => {
    console.log("Server started");
});