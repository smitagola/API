import { Router } from "express";
import { Auth } from "../middleware/auth.js";
import { addOrUpdateCart, decreaseProductQuantity, removeFromCart } from "../controller/cart.controller.js";

const router = Router();

router.route('/addtocart').post(Auth,addOrUpdateCart);

router.route("/decreasequantity").post(Auth, decreaseProductQuantity);

router.route("/remove").post(Auth, removeFromCart);

export default router;