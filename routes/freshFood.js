import express from "express";
import freshFoodModel from "../models/freshFood.js";
import { handleSuccess } from "../utils/handleSuccess.js";
import { handleErrorAsync } from "../utils/handleErrorAsync.js";
import { appError } from "../utils/appError.js";

const freshFoodRoute = express.Router();

freshFoodRoute.get("/", async (req, res) => {
  const freshFoods = await freshFoodModel.find();
  //   res.status(200).json({
  //     status: "success", // 狀態為成功
  //     results: freshFoods.length, // 回傳的 freshFoods 數量
  //     data: freshFoods, // 回傳所有 freshFoods 的資料
  //   });
  handleSuccess(res, freshFoods, "取得所有 freshFoods 成功", 200);
});

freshFoodRoute.post(
  "/calculatefood",
  /*  #swagger.tags = ['Food']
      #swagger.summary = '每日鮮食計算'
      #swagger.description = '每日鮮食計算'
      #swagger.parameters['body'] = {
          in: 'body',
          required: true,
          schema:{
              $memberId:'會員 ID',
              $weight:'體重',
              $activity: '活動量',
              $foodId:'食物 ID',
          }
      }
  */
  async (req, res, next) => {
    // 取得參數
    const { weight, activity, foodId } = req.body;

    // 驗證必填欄位
    if (!weight || !activity || !foodId) {
      return next(appError(400, "weight, activity, foodId 為必填"));
    }

    // 驗證食物是否存在
    const freshFood = await freshFoodModel.findById(foodId);
    if (!freshFood) {
      return next(appError(400, "食物不存在"));
    }

    // 使用新的 BMR 計算公式
    const K = 175; // 鸚鵡的 K 值
    const BMR = K * Math.pow(weight / 1000, 0.75); // 體重轉換為公斤並計算基礎代謝率

    // 根據活動水平調整BMR
    let activityLevel = 1;
    switch (activity) {
      case "low":
        activityLevel = 1.2;
        break;
      case "medium":
        activityLevel = 1.4;
        break;
      case "high":
        activityLevel = 1.6;
        break;
    }
    const adjustedBMR = BMR * activityLevel; // 調整後的BMR

    // 計算每日所需熱量
    let dailyCalories = adjustedBMR;

    // 營養素需求計算 (每日所需熱量的20%為蛋白質需求，20%為脂肪需求，60%為碳水化合物需求)
    const dailyProteinNeed = (dailyCalories * 0.2) / 4; // 蛋白質每克4卡
    const dailyFatNeed = (dailyCalories * 0.2) / 9; // 脂肪每克9卡
    const dailyCarbsNeed = (dailyCalories * 0.6) / 4; // 碳水化合物每克4卡

    // 計算該食物可攝取量
    const foodCalories = freshFood.calories;
    const foodProtein = freshFood.protein;
    const foodFat = freshFood.fat;
    const foodCarbs = freshFood.carbs;
    const foodMaxIntake = freshFood.maxIntake;

    // 計算該食物每日可攝取量
    let maxCaloriesFromFood = foodCalories * (foodMaxIntake / 100); // 每日最大攝取量下的熱量
    let maxFoodIntake = Math.min(
      foodMaxIntake,
      (dailyCalories / foodCalories) * 100
    ); // 不超過每日所需熱量的最大攝取量(g)

    // 計算食物提供的營養素量
    let proteinIntake = (maxFoodIntake * (foodProtein / 100)).toFixed(2);
    let fatIntake = (maxFoodIntake * (foodFat / 100)).toFixed(2);
    let carbsIntake = (maxFoodIntake * (foodCarbs / 100)).toFixed(2);

    // 計算食物提供的總熱量
    let foodProvidedCalories = (
      proteinIntake * 4 +
      fatIntake * 9 +
      carbsIntake * 4
    ).toFixed(2);

    // 計算與每日所需熱量的差異
    let caloriesDifference = (dailyCalories - foodProvidedCalories).toFixed(2);

    // 計算食物提供的營養素熱量
    let proteinCalories = (proteinIntake * 4).toFixed(2); // 蛋白質提供的熱量
    let fatCalories = (fatIntake * 9).toFixed(2); // 脂肪提供的熱量
    let carbsCalories = (carbsIntake * 4).toFixed(2); // 碳水化合物提供的熱量

    // 返回結果
    let data = {
      weight,
      activity,
      food: freshFood,
      BMR: BMR.toFixed(2), // 基礎代謝率 (BMR)
      adjustedBMR: adjustedBMR.toFixed(2), // 調整後的 BMR
      dailyCalories: dailyCalories.toFixed(2), // 每日所需熱量
      dailyProteinNeed: dailyProteinNeed.toFixed(2), // 每日所需蛋白質
      dailyFatNeed: dailyFatNeed.toFixed(2), // 每日所需脂肪
      dailyCarbsNeed: dailyCarbsNeed.toFixed(2), // 每日所需碳水化合物
      maxIntake: foodMaxIntake.toFixed(2), // 最大攝取量
      foodIntake: maxFoodIntake.toFixed(2), // 實際攝取量
      nutrientsProvided: {
        protein: proteinIntake, // 每日食物中的蛋白質克數
        fat: fatIntake, // 每日食物中的脂肪克數
        carbs: carbsIntake, // 每日食物中的碳水化合物克數
      },
      foodProvidedCalories: foodProvidedCalories, // 食物提供的總熱量
      caloriesDifference: caloriesDifference, // 熱量差異
      detailedNutrientsCalories: {
        protein: proteinCalories, // 蛋白質提供的熱量
        fat: fatCalories, // 脂肪提供的熱量
        carbs: carbsCalories, // 碳水化合物提供的熱量
      },
    };

    handleSuccess(res, data, "計算鮮食可攝取量成功");
  }
);

export default freshFoodRoute;
