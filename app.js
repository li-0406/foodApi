import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import router from "./routes/index.js";
import usersRouter from "./routes/users.js";
import feedbackRoute from "./routes/feedback.js";
import freshFoodRoute from "./routes/freshFood.js";
import mongoose from "mongoose"; // 導入 mongoose 套件使用
import cors from "cors"; // 引入 CORS 套件
import dotenv from "dotenv"; //引入 dotenv 套件
import swaggerUi from "swagger-ui-express";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const swaggerFile = require("./swagger_output.json");

const app = express();

app.use(cors()); // 允許所有來源的請求
// app.use(cors({
//   origin: 'http://yourfrontend.com',// 只允許這個網域的請求
//   methods: ['GET', 'POST']// 只允許 GET 和 POST 請求
// }));

// 將 .env 檔案中的變數載入到 process.env 中
dotenv.config({ path: "./config.env" });

// 宣告 DB 常數，將 <password> 字串替換為 .env 檔案內的 DATABASE_PASSWORD (資料庫密碼)
const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

// 連接資料庫
mongoose
  .connect(DB)
  .then(() => console.log("資料庫連接成功")) // 連接成功會看到 log("資料庫連接成功")
  .catch((err) => {
    console.log("MongoDB 連接失敗:", err); // 反之，捕捉錯誤並 log 顯示錯誤原因
  });

// view engine setup
app.set("views", path.join(path.resolve(), "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), "public")));

app.use("/", router);
app.use("/users", usersRouter);
app.use("/feedbacks", feedbackRoute);
app.use("/freshFoods", freshFoodRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// 404 錯誤
app.use(function (req, res, next) {
  res.status(404).json({
    status: "error",
    message: "無此路由資訊",
    path: req.originalUrl,
  });
});

// * 開發環境 錯誤處理
const resError = (err, res) => {
  res.status(err.statusCode).json({
    message: err.message,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
    stack: err.stack,
  });
};
app.use(function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;

  if (err.name === "ValidationError") {
    err.message = "資料欄位未填寫正確,請重新輸入！";
    err.isOperational = true;
    return resError(err, res);
  }

  resError(err, res);
});

// 程式出現重大錯誤時
process.on("uncaughtException", (err) => {
  // 記錄錯誤下來,等到服務都處理完後,停掉該 process
  console.error("Uncaughted Exception！");
  console.error(err);
  process.exit(1);
});
// 未捕獲到的 catch
process.on("unhandledRejection", (err, promise) => {
  console.error("未捕獲到的 rejection：", promise, "原因：", err);
});

export default app;
