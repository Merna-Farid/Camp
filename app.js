if(process.env.NODE_ENV!=="production"){
    require("dotenv").config();
}
const express=require("express")
const app=express()
const path=require("path")
const ejsMate=require('ejs-mate')
const method=require("method-override")
const catchAsync=require("./utils/wrapAsync")
const appError=require("./utils/expressError")
const Camps=require("./models/model")
const Review=require("./models/review")
const mongoose=require("mongoose")
const Basejoi=require("joi")
const passport=require("passport")
const local=require("passport-local")
const User=require("./models/user")
const { error } = require("console")
const session = require('express-session')
const flash=require("connect-flash")
const campsController=require("./controllers/camps")
const reviewController=require("./controllers/reviews")
const usersController=require("./controllers/users")
const mongoSanitize = require('express-mongo-sanitize');
const sanitizeHtml=require("sanitize-html")
const helmet = require('helmet');
const dbUrl=process.env.DbUrl || 'mongodb://127.0.0.1:27017/camp'
const MongoStore = require('connect-mongo');
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});
store.on("error",function(e){
    console.log("Session store error",e)

})

mongoose.connect(dbUrl)
const db=mongoose.connection;
db.on("error",console.error.bind(console,"connection error"))
db.once("open",()=>{
    console.log("Database connected")
})



const sessionConfig={
    secret:"secret",
    store: MongoStore.create({ mongoUrl: dbUrl }),
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        maxAge:1000*60*60*24*7
    }

}


const scriptSrcUrls = [
    "https://cdn.maptiler.com",
    "https://api.maptiler.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com",
    "https://stackpath.bootstrapcdn.com",
]
const styleSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/",
    "https://api.maptiler.com/"
   
];
const connectSrcUrls = [
    "https://api.maptiler.com/"
];


app.set("views",path.join(__dirname,"views"))
app.set("view engine","ejs")
app.use(flash())
app.use(express.static(path.join(__dirname,'public')))
app.use(method('_method'))//use every single request
app.use(express.urlencoded({extended:true}))
app.use(session(sessionConfig))
app.use(passport.initialize())
app.use(passport.session())
app.engine("ejs",ejsMate)
passport.use(new local(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.use(mongoSanitize());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
          defaultSrc:[],
          connectSrc: ["'self'", ...connectSrcUrls],
          scriptSrc: ["'unsafe-inline'","'self'", ...scriptSrcUrls],
          styleSrc: ["'self'","'unsafe-inline'", ...styleSrcUrls],
          workerSrc: ["'self'", "blob:"],
          imgSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://images.unsplash.com"]
        //   "font-src": ["'self'", "example.com"]
        },
      },
    ),
  );




//Setting res.locals: The res.locals object is a special object 
//in Express that is used to pass data to the views (templates) rendered 
//by the application. Any properties added to res.locals will be available in the views.
app.use((req,res,next)=>{
    res.locals.URL=req.session.returnTo
    res.locals.success=req.flash("success")
    res.locals.error=req.flash("error")
    res.locals.currentUser=req.user
    next()
})



//middleware

const extension=(joi)=>({
    type:'string',
    base:joi.string(),
    messages:{
        'string.escapeHTML':'{{#label}} must not include HTML!'
    },
    rules:{
        escapeHTML:{
            validate(value,helpers){
                const clean=sanitizeHtml(value,{
                    allowedTags:[],
                    allowedAttributes:{},
                });
                if(clean!==value) return helpers.error('string.escapeHTML',{value})
                return clean
            }
        }
    }
});

const joi=Basejoi.extend(extension)
const validate=function(req,res,next){
    const campSchema=joi.object({
        title:joi.string().required().escapeHTML(),
        price:joi.number().min(0),
        location:joi.string().required().escapeHTML(),
        description:joi.string().required().escapeHTML()
    }).required()

    const {error}=campSchema.validate(req.body)
    
    if(error){
        const msg=error.details[0].message
        
        throw new appError(msg,400)
    }
    else{next()}
}

const isOwner=async(req,res,next)=>{
    const {id}=req.params
    let camp=await Camps.findById(id).populate('authors')
    const currentUser=req.user
    if(currentUser&&currentUser.username!=camp.authors[0].username ){
        req.flash("error","You don't have the permission to do that")
        return res.redirect(`/camps/${id}`)
    }
    next()
}

const isReviewOwner=async(req,res,next)=>{
    const {id,reviewId}=req.params
    let review=await Review.findById(reviewId).populate('authors')
    const currentUser=req.user
    if(currentUser&&currentUser.username!=review.authors[0].username ){
        req.flash("error","You don't have the permission to do that")
        return res.redirect(`/camps/${id}`)
    }
    next()
}

const validateReview=function(req,res,next){
    const reviewSchema=joi.object({
        body:joi.string().required().escapeHTML(),
        rating:joi.number().required().min(0).max(5),
    }).required()

    const {error}=reviewSchema.validate(req.body.review)
    
    if(error){
        const msg=error.details[0].message
        
        throw new appError(msg,400)
    }
    else{next()}


}

const isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.returnTo=req.originalUrl
        req.flash("error","You must be logged in")
        res.redirect("/login")
    }
    next()
}


app.get("/",(req,res)=>{
    res.render("./home")
})

app.get("/camps",campsController.show)
app.get("/camps/new",isLoggedIn,async (req,res)=>{res.render("./camps/new")})
app.post("/camps",isLoggedIn,validate,catchAsync(campsController.addCamp))
app.delete("/camps/:id",isOwner,isLoggedIn,campsController.destroyCamp)
app.put("/camps/:id",isLoggedIn,isOwner,validate,catchAsync(campsController.editCamp))
app.get("/camps/:id",isLoggedIn,catchAsync(campsController.showOne))
app.get("/camps/:id/edit",isOwner,isLoggedIn,campsController.updateCamp)
       

app.post("/camps/:id/review",isLoggedIn,validateReview,
    catchAsync(reviewController.addReview))
// app.get("/camps/:id/review",isLoggedIn,catchAsync(campsController.showOne))
app.delete("/camps/:id/review/:reviewId",isReviewOwner,isLoggedIn,catchAsync(reviewController.destroyReview))





app.get("/register",async (req,res)=>{
    res.render("./users/register")
       
})
app.post("/register",catchAsync(usersController.register))
app.get("/login",async (req,res)=>{res.render("./users/login")})
app.post("/login",
    passport.authenticate('local',{failureFlash:true,failureRedirect:'login'}),
usersController.login)
app.get('/logout', usersController.logout); 



app.get("/error",(req,res)=>{
    throw new Error("Errooooooooooor")
})
app.all("*",(req,res,next)=>{
    next(new appError("Page not found",404))
})

app.use((err,req,res,next)=>{
    const {statusCode=500}=err
    if(!err.message){err.message="Error"}
    res.status(statusCode).render("./error",{err})
})
// app.listen(3000,(req,res)=>{
//     console.log("Listening")
// })
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
