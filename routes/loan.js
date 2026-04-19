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

    const parseRes = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/parse-cas`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
      },
    );

    const { investor, funds, summary } = parseRes.data;
    const ltvRes = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/calculate-ltv`,
      { funds },
      {
        timeout: 30000,
      }
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

  if (error.code === "ECONNABORTED") {
    return res.status(504).json({
      success: false,
      message: "Request timed out. Please try again.",
    });
  }

  return res.status(500).json({
    success: false,
    message:
      error?.response?.data?.detail ||
      "Something went wrong while processing your file.",
  });
}
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
    console.error("Error fetching session:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while processing your file.",
    });
  }
});

export default router;
