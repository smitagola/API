// import {  Pool } from "pg";
import pkg from "pg"
const {  Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

export const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.on("connect", () => {
  console.log("Connected to thess database");
});

db.on("error", (err) => {
  console.error("Error connecting to the database", err.stack);
});
