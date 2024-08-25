
# E-commerce Application

This project is an e-commerce application built using Node.js, Express, PostgreSQL, and several other technologies. The application allows users to register, log in, add products to the cart, place orders, and manage their order history. 


## Features

- User registration and authentication using JWT.
- Add products to the cart and view cart items.
- Place orders from the cart.
- View order history.
- Product-wise ordering quantity with total item value.
- Checkout functionality with optional user address handling.



- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens), bcrypt for password hashing
- **Environment Management**: dotenv

- 
## RUN 
npm start


**API Endpoints**

- **Authentication**
  - `POST /api/v1/auth/signup`: Register a new user
  - `POST /api/v1/auth/login`: Log in a user and return an access token
  - `POST /api/v1/auth/logout`: Log out a user

- **Cart Management**
  - `POST /api/v1/cart/:id/add`: Add a product to the user's cart
  - `GET /api/v1/cart/:id`: Get all cart items for the user
  - `DELETE /api/v1/cart/:id/remove`: Remove a product from the cart

- **Order Management**
  - `POST /api/v1/orders/:id/place`: Place an order from the user's cart
  - `GET /api/v1/orders/:id`: Get all orders of the logged-in user
  - `GET /api/v1/order/:orderId`: Get details of a specific order

- **Product Analysis**
  - `GET /api/v1/products/summary`: Get product-wise ordering quantity with total item value
