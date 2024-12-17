
const model=require("../models/model")
const { getImages } =require("./getImage")
const mongoose=require("mongoose")
const {descriptors,places}=require("./seedHelpers")
const cities=require("./cities")
if(process.env.NODE_ENV!=="production"){
    require("dotenv").config();
}
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;



mongoose.connect(process.env.DbUrl)

const db=mongoose.connection;
db.on("error",console.error.bind(console,"connection error"))
db.once("open",()=>{
    console.log("Database connected")
})


const Camps=model
const random=array=>array[Math.floor(Math.random()*array.length)]

async function assignImage(){
    const imagesArray = await getImages();
    const randomIndex = Math.floor(Math.random() * imagesArray.length);
    const randomImage = imagesArray[randomIndex];
    return randomImage

}


  

const seed=async ()=>{
    await Camps.deleteMany({})
    for(let i=0;i<100;i++){
        const random1000=Math.floor(Math.random()*1000)
        const randPrice=Math.floor(Math.random()*100)
        
        const camp=new Camps({
            title:`${random(descriptors)},${random(places)}`,
            location:`${cities[random1000].city},${cities[random1000].state}`,
            description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet nulla auctor,",
            price:randPrice,
            image:await assignImage(),
            authors:"67607cf0b0162f0a13175917"

        })
        const geoData = await maptilerClient.geocoding.forward(camp.location, { limit: 1 })
        camp.geometry=geoData.features[0].geometry
        await camp.save()
}
}

seed().then((res)=>{
    db.close()
    console.log("closed")
}
)