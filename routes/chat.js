import express from "express";
import axios from "axios";

const router = express.Router();
const PYTHON = process.env.PYTHON_SERVICE_URL;
const session = new Map();

router.post("/", async (req, res) => {
  try {
    const { message, portfolio, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message require" });
    }
    const response = await axios.post(
      `${PYTHON}/chat`,
      { message, portfolio: portfolio || {}, history },
      { timeout: 3000 },
    );

    res.json({ reply: response.data.reply });
  } catch (error) {
    console.error("FULL ERROR:", error);
    console.error("RESPONSE DATA:", error?.response?.data);
    console.error("MESSAGE:", error.message);

    return res.status(500).json({
      error: error?.response?.data || error.message,
    });
  }
});

export default router;
