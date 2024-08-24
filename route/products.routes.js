import { Router } from "express";
import { getAllProducts} from "../controller/products.controller.js";
import { Auth } from "../middleware/auth.js";

const router = Router();

router.route('/all').get(Auth, getAllProducts);

export default router;