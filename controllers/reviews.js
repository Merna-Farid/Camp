const Camps=require("../models/model")
const Review=require("../models/review")
module.exports.addReview=async(req,res)=>{
    const camp=await Camps.findById(req.params.id).populate({path:'reviews',populate:{path:'authors'}})
    const review=new Review(req.body.review)
    review.authors=req.user._id
    camp.reviews.push(review)
    await review.save()
    await camp.save()
    res.redirect(`/camps/${camp._id}`)
    
    }

module.exports.destroyReview=async (req,res)=>{
    const {id,reviewId}=req.params
    await Camps.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
    const review=await Review.findByIdAndDelete(reviewId)
    const camp=await Camps.findById(id).populate({path:'reviews',populate:{path:'authors'}})
    res.redirect(`/camps/${id}`)
   
}