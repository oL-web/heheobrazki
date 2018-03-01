const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate');

const commentSchema = new mongoose.Schema({
    author:{type:mongoose.Schema.Types.ObjectId,  ref:"user", required:true},
    message:{type:String,required:true},
    timestamp:{type:Number, required:true},
    upvotesFrom: {type:[mongoose.Schema.Types.ObjectId], default:[]}
});

const pictureSchema = new mongoose.Schema({
    author:{type:mongoose.Schema.Types.ObjectId,  ref:"user", required:true},
    title: {type:String, required:true},
    description: String,
    filename:{type:String, required:true},
    timestamp:{type:Number, required:true},
    upvotesFrom: {type:[mongoose.Schema.Types.ObjectId], default:[]},
    comments: {type:[commentSchema], default:[]},
});

pictureSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("picture", pictureSchema);