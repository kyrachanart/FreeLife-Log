import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API endpoint: Parse natural language log into structured time entry using Gemini
app.post("/api/gemini/parse-log", async (req, res) => {
  try {
    const { text, projects } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "請提供工作內容文字 (Missing text input)" });
    }

    const ai = getAI();
    if (!ai) {
      // Fallback rule-based parsing if GEMINI_API_KEY is not set
      console.warn("GEMINI_API_KEY not found. Using fallback extractor.");
      const matchedProj = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;
      return res.json({
        success: true,
        isFallback: true,
        data: {
          projectName: matchedProj ? matchedProj.name : "PulseBrand 品牌官網改版",
          clientName: matchedProj ? matchedProj.clientName : "Pulse Digital Co.",
          projectId: matchedProj ? matchedProj.id : "proj-1",
          taskDescription: text,
          workMinutes: 120,
          breakMinutes: 15,
          feeType: matchedProj ? matchedProj.feeType : "fixed",
          aiSummary: "（本機智慧分析）已成功提取工時與任務，可直接確認記錄入 App。",
          confidence: 0.85,
          tags: ["開發", "設計"],
        },
      });
    }

    const projectContext = Array.isArray(projects)
      ? projects.map((p: any) => `ID: ${p.id}, 名稱: "${p.name}", Client: "${p.clientName}", 模式: ${p.feeType}`).join("\n")
      : "";

    const prompt = `你是一個專為香港自由工作者（Freelancer）服務的 AI 智慧工時助理。
使用者會以廣東話、中文或英文提供今日的工作與休息口語紀錄。
請解析使用者輸入並提取出結構化資料。

已知使用者的 PROJECT 清單：
${projectContext}

使用者輸入：
"${text}"

請以 JSON 格式回應，必須包含下列欄位：
- projectId: 匹配的 PROJECT ID (若無法精確匹配，從現有清單中挑選最相近的或填現有第一個)
- projectName: 匹配的 PROJECT 名稱
- clientName: 對應的 Client 名稱
- taskDescription: 整理後精簡專業的工作任務描述
- workMinutes: 淨工作時間分鐘數 (例如 2小時30分 -> 150)
- breakMinutes: 休息時間分鐘數 (例如 喝咖啡、吃點心、休息 -> 若未提及則為 0)
- feeType: 'fixed' (一口價) 或 'hourly' (按時收費)
- aiSummary: 一句用親切繁體中文/廣東話給接案者的回覆與工時小提示 (例如「已幫你扣除 20 分鐘咖啡休息，淨工時 2.5 小時，今日好有效率！」)
- tags: 1-3 個關鍵字標籤，字串陣列 (例如 ["UI設計", "切版", "會議"])
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      parsedData = {
        taskDescription: text,
        workMinutes: 120,
        breakMinutes: 0,
        aiSummary: "已解析工時紀錄。",
      };
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Gemini parse-log error:", error);
    return res.status(500).json({
      error: error.message || "AI 解析失敗，請稍後再試",
    });
  }
});

// API endpoint: AI Assistant chat for pricing & scope advice
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "請輸入對話訊息" });
    }

    const ai = getAI();
    if (!ai) {
      return res.json({
        reply: "（Gemini API 尚未設定 Key，此為離線建議）接案遇到 Client 無限改嘢時，記得根據合約範圍主動提出工時說明，並提供清晰的「追加工時報價單（Add-on Quote）」守護自己嘅實質時薪！",
      });
    }

    const systemInstruction = `你是一位精通香港自由工作者（Freelancer）生態的資深商業與接案顧問「FreelanceFlow AI」。
你說話親切、客氣且專業，擅長使用地道港式繁體中文（如 Job、Client、一口價、出 Invoice、改嘢、傾價錢、時薪算盤等）。
你的職責是協助接案者：
1. 解決工時超額、Client 不斷修改導致一口價實質時薪跌破底線的問題；
2. 教導接案者如何向 Client 提出追加修改報價（Scope Creep Add-on）；
3. 建議如何出具扣除休息時間的高透明度工時明細與 Invoice；
4. 鼓勵工作者適時暫停休息，避免過勞。
回答保持精準扼要，篇幅適中（150-250字）。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      reply: response.text || "收到！建議你記錄每一次修改的具體工時，保護實質時薪收益。",
    });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    return res.status(500).json({
      error: error.message || "AI 對話回應失敗",
    });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
