import { db } from "../db/db.js";

export const addOrUpdateCart = async (req, res) => {
    const { id } = req.params; // User ID
    console.log("userId in cart:", id);
    const userId = id;
    const { product_id, quantity } = req.body; // Product ID and Quantity from request body
    console.log("cart", req.body);

    // Validate required fields
    if (!userId || !product_id || quantity == null) {
        return res.status(400).json({ message: "User ID, Product ID, and Quantity are required.", success: false });
    }

    try {
        // Check if product exists and fetch stock quantity
        const productResult = await db.query("SELECT stock_quantity FROM products WHERE id = $1", [product_id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: "Product not found.", success: false });
        }

        const availableStock = productResult.rows[0].stock_quantity;

        // Check if requested quantity is available
        if (quantity > availableStock) {
            return res.status(400).json({ message: `Only ${availableStock} units are available in stock.`, success: false });
        }

        // Check if the user already has a cart
        const findCart = await db.query("SELECT id FROM cart WHERE user_id = $1", [userId]);
        let cart_id;

        if (findCart.rows.length > 0) {
            cart_id = findCart.rows[0].id;
        } else {
            // If no cart, create a new cart
            const newCart = await db.query(
                "INSERT INTO cart (user_id, created_at) VALUES ($1, NOW()) RETURNING id",
                [userId]
            );
            cart_id = newCart.rows[0].id;
        }

        // Check if the product is already in the cart
        const cartResult = await db.query(
            "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
            [cart_id, product_id]
        );

        if (cartResult.rows.length > 0) {
            // Product already in cart, update quantity
            const existingQuantity = cartResult.rows[0].quantity;
            const newQuantity = existingQuantity + quantity;

            if (newQuantity > availableStock) {
                return res.status(400).json({ message: `Only ${availableStock} units are available in stock.`, success: false });
            }

            await db.query(
                "UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3",
                [newQuantity, cart_id, product_id]
            );

            // Adjust stock quantity in the products table
            await db.query(
                "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                [quantity, product_id]
            );

        } else {
            // Product not in cart, add new cart item
            await db.query(
                "INSERT INTO cart_items (cart_id, product_id, quantity, added_at) VALUES ($1, $2, $3, NOW())",
                [cart_id, product_id, quantity]
            );

            // Adjust stock quantity in the products table
            await db.query(
                "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                [quantity, product_id]
            );
        }

        // Fetch updated cart items
        const cartItem = await db.query(
            `SELECT ci.product_id, ci.quantity, p.name, p.price
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = $1`,
            [cart_id]
        );

        return res.status(200).json({ message: "Product added/updated in cart successfully.", success: true, cartItem: cartItem.rows });
    } catch (err) {
        console.error("Error adding/updating product in cart:", err);
        return res.status(500).json({ message: "Error adding/updating product in cart.", success: false });
    }
};

export const decreaseProductQuantity = async (req, res) => {
    const { id } = req.params; // User ID
    console.log("userId in cart:", id);
    const userId = id;
    const { product_id } = req.body; // Product ID from request body
    console.log("cart", req.body);

    // Validate required fields
    if (!userId || !product_id) {
        return res.status(400).json({ message: "User ID and Product ID are required.", success: false });
    }

    try {
        // Check if the user has a cart
        const findCart = await db.query("SELECT id FROM cart WHERE user_id = $1", [userId]);
        if (findCart.rows.length === 0) {
            return res.status(404).json({ message: "Cart not found for user.", success: false });
        }
        const cart_id = findCart.rows[0].id;

        // Check if the product is in the cart
        const cartResult = await db.query(
            "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
            [cart_id, product_id]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({ message: "Product not found in cart.", success: false });
        }

        const existingQuantity = cartResult.rows[0].quantity;

        if (existingQuantity > 1) {
            // Decrease the quantity by 1
            const newQuantity = existingQuantity - 1;

            await db.query(
                "UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3",
                [newQuantity, cart_id, product_id]
            );

            // Restore 1 unit to stock quantity in the products table
            await db.query(
                "UPDATE products SET stock_quantity = stock_quantity + 1 WHERE id = $1",
                [product_id]
            );

        } else {
            // Remove the product from the cart if the quantity is 1
            await db.query(
                "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2",
                [cart_id, product_id]
            );

            // Restore 1 unit to stock quantity in the products table
            await db.query(
                "UPDATE products SET stock_quantity = stock_quantity + 1 WHERE id = $1",
                [product_id]
            );
        }

        // Fetch updated cart items
        const cartItem = await db.query(
            `SELECT ci.product_id, ci.quantity, p.name, p.price
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = $1`,
            [cart_id]
        );

        return res.status(200).json({ message: "Product quantity decreased successfully.", success: true, cartItem: cartItem.rows });
    } catch (err) {
        console.error("Error decreasing product quantity:", err);
        return res.status(500).json({ message: "Error decreasing product quantity.", success: false });
    }
};

export const removeFromCart = async (req, res) => {
    const { id } = req.params; // User ID
    // console.log("userId in cart:", id);s
    const userId = id;
    const { product_id } = req.body; // Product ID from request body
    // console.log("cart", req.body);

    // Validate required fields
    if (!userId || !product_id) {
        return res.status(400).json({ message: "User ID and Product ID are required.", success: false });
    }

    try {
        const findCart = await db.query("SELECT id FROM cart WHERE user_id = $1", [userId]);
        if (findCart.rows.length === 0) {
            return res.status(404).json({ message: "Cart not found for user.", success: false });
        }
        const cart_id = findCart.rows[0].id;

        // Check if the product is in the cart
        const cartResult = await db.query(
            "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
            [cart_id, product_id]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({ message: "Product not found in cart.", success: false });
        }

        await db.query(
            "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2",
            [cart_id, product_id]
        );

        return res.status(201).json({ message : "Product removed from cart Successfully.", success : true})

    } catch (error) {
        console.error("Error deleting product :", err);
        return res.status(500).json({ message: "Error deleting product .", success: false });
    }
}