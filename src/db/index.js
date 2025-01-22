import mongoose from "mongoose";
import { DB_NAME } from './constants';



const connectDB = async () =>{

    try {
         const connectionInstance =await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
         console.log(`"/n MONGODB CONNECTION SUCCESSFULLY !! DB HOST:" ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("MONGODB CONNECTION ERROR",error);
        process.exit(1);
        
    }

}

export default connectDB;
