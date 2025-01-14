import dotenv from 'dotenv'  
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path:'../.env'
})

connectDB()
.then(()=>{
    const port = process.env.PORT 
    app.listen(port || 8000,()=>{
        console.log("Server is running : ",port )
    })
    app.on("error",(err)=>{
        console.log("error",err)
        throw err
    })
})
.catch((err)=>{
    console.log("MongDB connetion failed",err)
})