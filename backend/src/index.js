import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import authRouthes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import cors from "cors";

dotenv.config();

const app = express();

const PORT = process.env.PORT

app.use(express.json());
app.use(cookieParser()); //cookie parser 은 유저가 담고있는 쿠키를 재해석하거나 활용할 수 있다.decrypt
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}))

app.use("/api/auth", authRouthes);
app.use("/api/messages", messageRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port:" + PORT)
  connectDB();
})
