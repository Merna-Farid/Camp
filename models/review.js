const mongoose=require("mongoose")
const Schema=mongoose.Schema

const reviewModel=new Schema({
    body:String,
    rating:Number,
    authors:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]

})



module.exports=mongoose.model("Review",reviewModel)

