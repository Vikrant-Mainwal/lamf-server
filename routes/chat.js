import express from "express";
import axios from "axios";

const router = express.Router();
const session = new Map();

router.post("/", async (req, res) => {
  try {
    const { message, portfolio, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message require" });
    }
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/chat`,
      { message, portfolio: portfolio || {}, history },
      { timeout: 3000 },
    );

    res.json({ reply: response.data.reply });
  } catch (error) {
    console.error("Error in chat route:", error);
    return res.status(500).json({
    success: false,
    message: "Something went wrong while processing your file.",
  });
  }
});

export default router;
