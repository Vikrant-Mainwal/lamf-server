import express, { application } from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { v4 as uuid } from "uuid";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const PYTHON = process.env.PYTHON_SERVICE_URL;

const sessions = new Map();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file require" });
    }

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: "application/pdf",
    });

    const parseRes = await axios.post(`${PYTHON}/parse-cas`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    const { investor, funds, summary } = parseRes.data;
    const ltvRes = await axios.post(
      `${PYTHON}/calculate-ltv`,
      { funds },
      { timeout: 10000 },
    );

    const ltv = ltvRes.data;

    const sessionId = uuid();
    const session = {
      sessionId,
      investor,
      funds,
      summary,
      ltv,
      createdAt: new Date(),
    };
    sessions.set(sessionId, session);

    res.json({ sessionId, investor, funds: ltv.funds, summary, ltv });
  } catch (error) {
    console.error("FULL ERROR:", error);
    console.error("RESPONSE DATA:", error?.response?.data);
    console.error("MESSAGE:", error.message);

    return res.status(500).json({
      error: error?.response?.data || error.message,
    });
  }
});

router.get("/session/:id", (req, res) => {
  try {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
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
