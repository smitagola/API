import { Router} from "express";
import userRoutes from "./user.routes.js";
import productRoutes from "./products.routes.js";
import checkoutRoutes from "./checkout.routes.js"
import cartRoutes from "./cart.routes.js"
import orderRoutes from "./order.routes.js"

const router = Router();

router.use("/users", userRoutes);

router.use('/products', productRoutes)

router.use("/checkout", checkoutRoutes)

router.use("/cart", cartRoutes)

router.use("/order", orderRoutes)

export default router;