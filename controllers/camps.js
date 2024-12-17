const Camps=require("../models/model")
const { getImages } =require("../seed/getImage")
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;


async function assignImage(){
    const imagesArray = await getImages();
    const randomIndex = Math.floor(Math.random() * imagesArray.length);
    const randomImage = imagesArray[randomIndex];
    return randomImage

}
module.exports.show=async (req,res)=>{
    const camps=await Camps.find({}).populate('authors')
    res.render("./camps/index",{camps})
    
    }


module.exports.destroyCamp=async (req,res)=>{
    const {id}=req.params
    const camp=await Camps.findByIdAndDelete(id)
    req.flash("error","Camp deleted")
    res.redirect("/camps")}


module.exports.editCamp=async (req,res,next)=>{
    const {id}=req.params
    const camp=await Camps.findByIdAndUpdate(id,{...req.body})
    const geoData = await maptilerClient.geocoding.forward(camp.location, { limit: 1 });
    camp.geometry = geoData.features[0].geometry; 
    return res.redirect(`/camps/${id}`)   
}

module.exports.showOne=async (req,res)=>{
    const {id}=req.params
    const camp=await Camps.findById(id).populate({path:'reviews',populate:{path:'authors'}}).populate('authors');
    return res.render("./camps/show",{camp})
    
}

module.exports.updateCamp=async (req,res)=>{
    const {id}=req.params
    const camp=await Camps.findById(id)
    return res.render("./camps/edit",{camp})}


module.exports.addCamp=async(req,res)=>{
    const camp = new Camps({...req.body,image:await assignImage()});
    camp.authors=req.user._id
    const geoData = await maptilerClient.geocoding.forward(camp.location, { limit: 1 });
    camp.geometry = geoData.features[0].geometry;
    await camp.save()
    req.flash("success","A new camp added!!!")
    return res.redirect(`/camps/${camp._id}`)
    
    }