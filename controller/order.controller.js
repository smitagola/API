import { db } from "../db/db.js";

export const placeOrder = async (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: "User is not logged in", success: false });
    }

    try {
        // Step 1: Find the user's cart
        const findCart = await db.query("SELECT id FROM cart WHERE user_id = $1", [userId]);
        if (findCart.rows.length === 0) {
            return res.status(404).json({ message: "No items are available in the cart. Please add products to the cart first." });
        }

        const cart_id = findCart.rows[0].id;

        // Step 2: Retrieve all items from the user's cart along with their prices
        const cartItems = await db.query(
            `SELECT ci.product_id, ci.quantity, p.price 
             FROM cart_items ci 
             JOIN products p ON ci.product_id = p.id 
             WHERE ci.cart_id = $1`,
            [cart_id]
        );

        if (cartItems.rows.length === 0) {
            return res.status(404).json({ message: "No items found in the cart to order." });
        }

        // Step 3: Calculate total amount
        let totalAmount = 0;
        cartItems.rows.forEach(item => {
            totalAmount += item.quantity * item.price;
        });

        // Step 4: Create a new order for the user
        const newOrder = await db.query(
            "INSERT INTO orders (user_id, status, total_amount, created_at) VALUES ($1, 'Pending', $2, NOW()) RETURNING id",
            [userId, totalAmount]
        );

        if (newOrder.rows.length === 0) {
            return res.status(500).json({ message: "Failed to create an order." });
        }

        // Get the newly created order ID
        const orderId = newOrder.rows[0].id;

        // Step 5: Move each cart item to the order_items table, including the item_price
        for (const item of cartItems.rows) {
            await db.query(
                "INSERT INTO order_items (order_id, product_id, quantity, item_price) VALUES ($1, $2, $3, $4)",
                [orderId, item.product_id, item.quantity, item.price]
            );
        }
        // Step 6: Clear the user's cart (optional)
        await db.query("DELETE FROM cart_items WHERE cart_id = $1", [cart_id]);

        const result = await db.query(`  
             SELECT
                o.id AS orderId,
                u.username,
                o.total_amount AS totalAmount,
                json_agg(
                    json_build_object(
                        'product_id', oi.product_id,
                        'quantity', oi.quantity,
                        'name', p.name,
                        'price', p.price
                    )
                ) AS items,
                a.residential_address,
                a.area,
                a.city,
                a.state,
                a.pincode
            FROM
                orders o
            JOIN
                users u ON o.user_id = u.id
            JOIN
                order_items oi ON o.id = oi.order_id
            JOIN
                products p ON oi.product_id = p.id
            JOIN
                address a ON o.user_id = a.user_id
            WHERE
                o.id = $1
            GROUP BY
                o.id, u.username, o.total_amount, a.residential_address, a.area, a.city, a.state, a.pincode`, [orderId])
        // Return the order details as response
        console.log(`result : ${result}`)
        return res.status(200).json({
            message: "Order placed successfully.",
            data : result.rows
            // orderId: orderId,
            // username: req.params.username,
            // totalAmount: totalAmount,
            // items: cartItems.rows,
        });
    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({ message: "Error placing order." });
    }
}
export const getOrders = async (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: "User is not logged in.", success: false });
    }

    try {
    //   Get the user's username
        const userQuery = `
            SELECT username
            FROM users
            WHERE id = $1
        `;
        const userResult = await db.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const username = userResult.rows[0].username;

        //  all orders for the user
        const ordersQuery = `
            SELECT o.id AS order_id
            FROM orders o
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `;
        const ordersResult = await db.query(ordersQuery, [userId]);

        // for all order, get the associated product IDs
        const ordersWithProductIds = await Promise.all(ordersResult.rows.map(async (order) => {
            const productIdsQuery = `
                SELECT p.id AS product_id
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = $1
            `;
            const productIdsResult = await db.query(productIdsQuery, [order.order_id]);

            return {
                order_id: order.order_id,
                products: productIdsResult.rows.map(product => ({ product_id: product.product_id }))
            };
        }));

        //respond with username and orders
        return res.status(200).json({ 
            username: username, 
            orders: ordersWithProductIds 
        });
    } catch (error) {
        console.error("Error getting orders:", error);
        return res.status(500).json({ message: "Error occurred while getting orders." });
    }
}

export const getUserProductStats = async (req, res) => {
    try {
        const result = await db.query(`
            WITH user_product_totals AS (
                SELECT
                    u.id AS userid,
                    u.username,
                    p.id AS productid,
                    p.name AS productname,
                    SUM(oi.quantity) AS totalquantity,
                    SUM(oi.quantity * p.price) AS totalvalue
                FROM
                    users u
                JOIN
                    orders o ON u.id = o.user_id
                JOIN
                    order_items oi ON o.id = oi.order_id
                JOIN
                    products p ON oi.product_id = p.id
                GROUP BY
                    u.id, u.username, p.id, p.name
            )
            SELECT
                userid,
                username,
                json_agg(
                    json_build_object(
                        'productid', productid,
                        'productname', productname,
                        'totalquantity', totalquantity,
                        'totalvalue', totalvalue
                    )
                ) AS orders
            FROM
                user_product_totals
            GROUP BY
                userid, username
            ORDER BY
                userid
        `);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error retrieving user product statistics:", err);
        return res.status(500).json({ success: false, message: "Error retrieving user product statistics" });
    }
};

export const getProductsWithUsers = async (req, res) => {
    try {
        const result = await db.query(`
            WITH user_details AS (
                SELECT
                    p.id AS productid,
                    p.name AS productname,
                    u.id AS userid,
                    u.username,
                    SUM(oi.quantity) AS totalquantity,
                    SUM(oi.quantity * p.price) AS totalvalue
                FROM
                    products p
                LEFT JOIN
                    order_items oi ON p.id = oi.product_id
                LEFT JOIN
                    orders o ON oi.order_id = o.id
                LEFT JOIN
                    users u ON o.user_id = u.id
                GROUP BY
                    p.id, p.name, u.id, u.username
            )
            SELECT
                productid,
                productname,
                json_agg(
                    json_build_object(
                        'userid', userid,
                        'username', username,
                        'totalquantity', totalquantity,
                        'totalvalue', totalvalue
                    )
                ) AS users
            FROM
                user_details
            GROUP BY
                productid, productname
            ORDER BY
                productid
        `);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error retrieving products with users:", err);
        return res.status(500).json({ success: false, message: "Error retrieving products with users" });
    }
};

export const getWeeklyOrdersAnalysis = async (req, res) => {
    try {
        // SQL query to get weekly orders analysis
        const query = `
            SELECT
                DATE_TRUNC('week', created_at) AS week_start_date,
                COUNT(id) AS total_orders,
                SUM(total_amount) AS total_revenue
            FROM
                orders
            WHERE
                created_at BETWEEN '2024-01-01' AND '2024-03-31'
            GROUP BY
                DATE_TRUNC('week', created_at)
            ORDER BY
                week_start_date;
        `;
        
        // Execute the query
        const result = await db.query(query);
        
        // Send response
        return res.status(200).json({
            success: true,
            data: result.rows,
            message: 'Weekly orders analysis for Q1 2024 retrieved successfully.'
        });
    } catch (error) {
        console.error('Error retrieving weekly orders analysis:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving weekly orders analysis.'
        });
    }
};

export const getQuantityWiseOrderStats = async (req, res) => {
    try {
        // SQL query to get product names and order counts
        const query = `
            SELECT
                p.name AS product_name,
                COUNT(oi.id) AS number_of_orders
            FROM
                products p
            JOIN
                order_items oi ON p.id = oi.product_id
            GROUP BY
                p.name
            HAVING
                COUNT(oi.id) >= 5
            ORDER BY
                number_of_orders DESC;
        `;
        
        // Execute the query
        const result = await db.query(query);
        
        // Send response
        return res.status(200).json({
            success: true,
            data: result.rows,
            message: 'Product order statistics retrieved successfully.'
        });
    } catch (error) {
        console.error('Error retrieving product order statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving product order statistics.'
        });
    }
};

export const getProductSalesStats = async (req, res) => {
    try {
        // SQL query to get products sold more than 7 times or not sold at all
        const query = `
            SELECT
                p.id AS product_id,
                p.name AS product_name,
                COALESCE(COUNT(oi.id), 0) AS number_of_orders
            FROM
                products p
            LEFT JOIN
                order_items oi ON p.id = oi.product_id
                AND oi.order_id IN (
                    SELECT id
                    FROM orders
                    WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31'
                )
            GROUP BY
                p.id, p.name
            HAVING
                COUNT(oi.id) > 7 OR COUNT(oi.id) = 0
            ORDER BY
                number_of_orders DESC;
        `;
       
        
        const result = await db.query(query);
        
        // Send response
        return res.status(200).json({
            success: true,
            data: result.rows,
            message: 'Product sales statistics for Q1 2024 retrieved successfully.'
        });
    } catch (error) {
        console.error('Error retrieving product sales statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving product sales statistics.'
        });
    }
};