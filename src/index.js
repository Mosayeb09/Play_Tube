// require('dotenv').config({path:"./env"})
import dotenv from "dotenv";
import connectDB from "./db/index.js";

// import express from "express";
import app from "./app.js";


dotenv.config(
    {path:"./.env"}
)

// const app = express();


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);	
    })
    app.on("err",()=>{
        console.log("Error",err);
        throw err;
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed !!",err);

})















/*
import express from "express";
const app = express();


( async()=>{
    try {
       const db = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
       app.on("error",(error)=>{
        console.log("error",error	);
        throw error;
       })
       app.listen(process.env.PORT,()=>{
        console.log (`App is listening on port ${process.env.PORT}`);
       })
        
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
        
    }
})()
*/