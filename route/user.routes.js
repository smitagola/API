import { Router } from "express";
import { signUp , getUsers, signIn, logout} from "../controller/user.controller.js";
import { Auth } from "../middleware/auth.js";
import {  getOrders } from "../controller/order.controller.js";

const router = Router();

router.route("/signup").post(signUp);

router.route('/signin').post(signIn)

router.route("/all").get(getUsers)

router.route('/logout').get(logout)

router.route('/getorders').get(Auth,getOrders)

export default router;