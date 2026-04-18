import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import loanRoutes from "./routes/loan.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({origin:"*",methods:["GET","POST","PUT","DELETE"]}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/loan", loanRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Loan Management System API");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});