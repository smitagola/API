import { db } from "../db/db.js";

export const checkout =async (req, res) => {
    const { id } = req.params;
    const { residential_address, area, city, state, pincode } = req.body;

    // Validate the required fields
    if (!residential_address || !area || !city || !state || !pincode) {
        return res.status(400).json({ message: "All address fields like { residential_address, area, city, state, pincode} and user ID are required.", success: false });
    }

    try {
        // Insert the address into the address table
        const result = await db.query(
            `INSERT INTO address (residential_address, area, city, state, pincode, user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING id`,
            [residential_address, area, city, state, pincode, id]
        );

        // Get the generated address id
        const addressId = result.rows[0].id;

        // Return success response with the generated address ID
        return res.status(201).json({
            message: "Address added successfully.",
            success: true,
            addressId: addressId,
        });
    } catch (err) {
        console.error("Error adding address:", err);
        return res.status(500).json({ message: "Error adding address.", success: false });
    }
}