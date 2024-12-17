const axios=require("axios")
if(process.env.NODE_ENV!=="production"){
  require("dotenv").config();
}
async function getImages() {
    const response = await axios.get(`https://api.unsplash.com//search/photos?query=camps&client_id=${process.env.API_KEY}`);
    const images = [];
    const num = response.data.results.length;
    for (let i = 0; i < num; i++) {
      if (response.data.results[i].urls.small) {
        images.push(response.data.results[i].urls.small);
      }
    }
    return images;
  }
  


  module.exports = { getImages };