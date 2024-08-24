import { Router } from "express";
import { Auth } from "../middleware/auth.js";
import { placeOrder, getUserProductStats, getOrders, getProductsWithUsers, getWeeklyOrdersAnalysis, getQuantityWiseOrderStats, getProductSalesStats} from "../controller/order.controller.js";

const router = Router();

router.route('/placeorder').post(Auth,placeOrder);
router.route("/all").get(Auth, getOrders);
router.route("/user-wise-product-state").get(Auth, getUserProductStats)
router.route("/product-wise-user-state").get(Auth, getProductsWithUsers)
router.route("/weekly-orders-analysis").get(getWeeklyOrdersAnalysis)
router.route("/quantity-wise-order").get(getQuantityWiseOrderStats)
router.route("/product-sales-state").get(getProductSalesStats)

export default router;