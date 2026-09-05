import express from "express"
import cors from "cors";
import fileRoutes from "./routes/fileRoutes.js"
import directoryRoutes from "./routes/directoryRoutes.js"

const app = express();
app.use(express.json());
app.use(cors());
app.use("/directory",directoryRoutes);
app.use("/file",fileRoutes);

app.listen(4000, "127.0.0.1", () => {
    console.log("Server started");
});