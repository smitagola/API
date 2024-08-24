import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import dotenv from "dotenv";
dotenv.config();
export const getUsers = (req, res) => {
    const q = "SELECT * FROM users";

    db.query(q, (err, data) => {
        if (err) return res.status(501).json(err);
        return res.status(200).json(data.rows);
    });
}

export const signUp = async (req, res) => {
    try {
        const { username, email, password} = req.body;
        const checkUser = "SELECT * FROM users WHERE email = $1";
        const query = "INSERT INTO users (username,email, password) VALUES ($1,$2,$3) ";

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        db.query(checkUser, [email], (err, data) => {
            // console.log(`error : ${err}`);
            // console.log(`data : ${data.rowCount}`)
            if(err) return res.status(501).json({ message : "Error while checking the user.", success : false});

            if(data.rows.length > 0){
                return res.status(201).json({ message: "User Exist", success : false });
            } else {
                db.query(query, [username, email, hashedPassword], (err, result) => {
                    if (err) return res.status(501).json(err);
                    // console.log(`Data addes : ${result.rows}`)
                    return res.status(200).json({ message: "User Register successfully", success : true });
                })
            }
        })
    } catch (error) {
        return res.status(409).json({ message : "Something went wrong while signup.", success : false})
    }
}

export const signIn = (req, res) => {
    try {
        let  token;
        const { password, email } = req.body
        const signInQuery = "SELECT * FROM users WHERE email = $1" ;
        db. query(signInQuery, [email], async (err, data) => {
            // console.log(`Error : ${err}`);
            // console.log(`Data : ${data}`)
            if(err) return res.status(501).json({ message : err, success : false});

            const isPasswordCorrect = await bcrypt.compare(password, data.rows[0].password);
            token = jwt.sign({ id: data.rows[0].id, email: data.rows[0].email }, process.env.JWT_TOKEN);
            if(!isPasswordCorrect) return res.status(401).json({ message : "Invalid credentials.", success : false});
          const option = {
            httpOnly : true,
            secure :true
          }
            return res.cookie("token",token,option).status(200).json({
                message: 'Login successful',
                token: token, // This is optional, useful for debugging or token management in frontend
            });
        })
    } catch (error) {
        return res.status(409).json({ message : "Something went wrong while signin.", success : false})
    }
}

export const logout = (req,res)=>{
    // here we clear cookies so user is logout from system
    return res.clearCookie("token").status(200).json({ message: "User logged out successfully.", success: true });
}


