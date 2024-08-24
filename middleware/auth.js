import jwt from "jsonwebtoken";

export const Auth = (req, res, next) => {
    console.log(`cookies : ${req.cookies?.token}`)
    console.log(`header : ${req.header("Authorization")?.replace("Bearer ", "")}`)
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    // console.log(token);
    if (!token) {
        return res.status(400).json({ message: "No Authorized Request." })
    }
    const verifiedToken = jwt.verify(token, process.env.JWT_TOKEN);
    // console.log("verifyToken",verifiedToken);
    if(verifiedToken){
        let id = verifiedToken.id;
        req.params.id = id;
        next()
    } else {
        return res.send(401).json({ message: "No Authorized Request" });
    }
}