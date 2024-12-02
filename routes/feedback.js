import express from "express";
import Feedback from "../models/feedback.js";
import { handleSuccess } from "../utils/handleSuccess.js";
import { handleErrorAsync } from "../utils/handleErrorAsync.js";
import { appError } from "../utils/appError.js";

const feedbackRoute = express.Router();
// 新增 feedback
feedbackRoute.post(
  "/",
  async (req, res, next) => {
    // 從請求的 body 中提取出用戶提交的資料（姓名、電話、信箱、反饋內容）
    const { contactPerson, phone, email, feedback } = req.body;

    // 驗證必填欄位，檢查是否提供了姓名、信箱和反饋內容
    if (!contactPerson || !email || !feedback) {
      // 使用 appError 函式創建錯誤物件
      return next(appError(400, "姓名、信箱、內容為必填欄位"));
    }

    // 如果必填欄位都有，使用 Feedback 模型創建一條新的反饋記錄
    const newFeedback = await Feedback.create({
      contactPerson, // 設置聯絡人姓名
      phone, // 設置聯絡人電話（可選）
      email, // 設置聯絡人信箱
      feedback, // 設置反饋內容
    });

    // 成功創建後，回應 201 狀態（已創建）和成功信息，包含新創建的反饋數據
    handleSuccess(res, newFeedback, "新增成功", 201);
  }
  /*  #swagger.tags = ['Feedback']
	    #swagger.summary = '新增回饋'
	    #swagger.description = '新增回饋'
	    #swagger.parameters['body'] = {
	        in: 'body',
	        required: true,
	        schema:{
	            $contactPerson:'姓名',
	            $phone:'電話',
	            $email: '信箱',
	            $feedback: '內容',
	            $source: '從哪裡得知此網站',
	        }
	    }
	*/
);

// 取得所有 feedback
feedbackRoute.get("/", async (req, res) => {
  try {
    // 使用 find() 方法從資料庫中取得所有 feedbacks
    const feedbacks = await Feedback.find();

    // 成功取得資料後，回應 200 狀態碼和回傳的資料
    res.status(200).json({
      status: "success", // 狀態為成功
      results: feedbacks.length, // 回傳的 feedbacks 數量
      data: feedbacks, // 回傳所有 feedbacks 的資料
    });
  } catch (error) {
    // 如果發生錯誤（如資料庫連接問題），回應 404 錯誤狀態和錯誤訊息
    res.status(404).json({
      status: "fail", // 狀態為失敗
      message: error.message, // 返回錯誤訊息
    });
  }
});

// 取得指定 id feedback
feedbackRoute.get("/:id", async (req, res) => {
  try {
    // 使用 findById 方法從資料庫中取得指定 id 的 feedback
    const feedback = await Feedback.findById(req.params.id);

    // 如果找不到該 id 對應的資料，回應 404 錯誤狀態和錯誤訊息
    if (!feedback) {
      return res.status(404).json({
        status: "fail",
        message: "找不到該 feedback",
      });
    }

    res.status(200).json({
      status: "success",
      data: feedback,
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error.message,
    });
  }
});

// 更新指定 id feedback
feedbackRoute.patch("/:id", async (req, res) => {
  try {
    const { contactPerson, email, feedback } = req.body;
    if (!contactPerson || !email || !feedback) {
      res.status(400).json({
        status: "fail",
        message: "姓名、信箱、內容為必填欄位",
      });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    // 如果找不到該資料，回應 404 錯誤
    if (!updatedFeedback) {
      return res.status(404).json({
        status: "fail",
        message: "找不到該 feedback",
      });
    }
    // 成功更新後回應 200 狀態和更新後的資料
    res.status(200).json({
      status: "success",
      data: updatedFeedback,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
});

// 刪除指定 id feedback
feedbackRoute.delete("/:id", async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        status: "fail",
        message: "找不到該 feedback",
      });
    }

    res.status(200).json({
      status: "success",
      message: "刪除成功",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
});

export default feedbackRoute;
