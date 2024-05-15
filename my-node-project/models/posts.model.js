import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const postSchema = new mongoose.Schema({
    id:{type: String, default: uuidv4,unique:true, required:true},
    userid:{type:String, required:true},
    caption: {type:String},
    Date: {type:Date, default: Date.now},
    });
export default mongoose.model('Post', postSchema);