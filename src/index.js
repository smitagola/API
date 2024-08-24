import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import router from '../route/app.routes.js';
import { db } from '../db/db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({ credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/v1', router);

// Test database connection
// db.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.error('Error executing query', err.stack);
//   } else {
//     console.log('Database connected successfully', res.rows[0]);
//   }
// });

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log(`API is running on http://localhost:${process.env.PORT || 3000}/api`);
});