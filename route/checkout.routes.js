import { Router } from "express";
import { Auth } from "../middleware/auth.js";
import { checkout } from "../controller/checkout.controller.js";

const router = Router();

router.route("/").post(Auth, checkout );

export default router;