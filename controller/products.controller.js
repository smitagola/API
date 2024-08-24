import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import dotenv from "dotenv";

dotenv.config();

export const getAllProducts = (req,res) => {
    console.log("user --",req.params.id);
    try {
        const query = "SELECT * FROM products";
        db.query(query, (err, data) => {
            if (err) return res.status(501).json(err);
            return res.status(200).json(data.rows);
        })
    } catch (error) {
        return res.status(409).json({ message : "Something went wrong while get product list.", success : false})
    }
}