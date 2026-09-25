import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";
import fileRoutes from "./routes/fileRoutes.js"
import directoryRoutes from "./routes/directoryRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import checkAuth from "./auth.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    "origin":"http://localhost:5173",
    "credentials":true,
}));
app.use("/directory",checkAuth,directoryRoutes);
app.use("/file",checkAuth,fileRoutes);

app.use("/user",userRoutes);

app.use((err,req,res,next)=>{
    res.status(err.status || 500).json({message:"Something went wrong on Server \n Please refresh or Try again later"})
});
app.listen(4000, "127.0.0.1", () => {
    console.log("Server started");
});