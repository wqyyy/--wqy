import express from "express";
import cors from "cors";
import policiesRouter from "./routes/policies";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());

app.use("/api/policies", policiesRouter);

/** 健康檢查 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`惠企政策大脑后端服务已启动：http://localhost:${PORT}`);
});
