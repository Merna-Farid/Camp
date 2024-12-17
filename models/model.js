const mongoose=require("mongoose")
const Review=require("./review")
const { formToJSON } = require("axios")
const Schema=mongoose.Schema

const opts={toJSON:{virtuals:true}};
const CampSchema=new Schema({
    title:String,
    price: { type: Number, required: true },
    location:String,
   description:String,
   image:String,
   geometry: {
    type: {
      type: String, 
      enum: ['Point'], 
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
   reviews:[{
    type:Schema.Types.ObjectId,
    ref:"Review"
   }],
   authors:[{
    type:Schema.Types.ObjectId,
    ref:"User"
   }]

},opts)
CampSchema.virtual('properties.popUpMarkup').get(function(){
  return `<a href="/camps/${this.id}">${this.title}</a>`
})

CampSchema.post("findOneAndDelete",async function(doc){
    if(doc){
        await Review.deleteMany({_id:{$in:doc.reviews}})
    }
})


module.exports=mongoose.model("camp",CampSchema)