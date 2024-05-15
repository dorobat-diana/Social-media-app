import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
    id:{type: String, default: uuidv4,unique:true},
    name: {type:String, required:true},
    email: {type:String,required:true, unique:true},
    password: {type:String, required:true},
    age: {type:Number, required:true},
    tokens: [
        {
          token: {
            type: String,
            required: true,
          },
        },
      ],   
    });
export default mongoose.model('User', userSchema);