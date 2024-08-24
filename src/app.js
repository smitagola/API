import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import router from "../route/app.routes"
import { db } from "../db/db";

const app = express();

db.connect((error) => {
    if(error){
        console.log("There is error while connecting to the Database");
    } else {
        console.log("Connecting to the Database.")
    }
});

app.use(
    cors({ credentials : true})
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/api/v1", router)

app.listen(process.env.PORT, () => {
    console.log(`API is running to the port : http://localhost:${process.env.PORT}/api`)
})