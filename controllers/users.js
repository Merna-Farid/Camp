const User=require("../models/user")

module.exports.login=(req,res)=>{
    req.flash("success","Welcome to camp")
    const redirectedUrl=res.locals.URL|| "/camps"
    delete req.session.returnTo
    return res.redirect(redirectedUrl)}

module.exports.logout=(req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/login');
    });
}

module.exports.register=async (req,res,next)=>{
    try{
        const {username,email,password}=req.body
        const user=new User({username,email})
        const registeredUser=await User.register(user,req.body.password)
        req.login(registeredUser,(err)=>{
            if(err) return next(err)
                req.flash("success","Welcome to Camp!")
                res.redirect("/camps")  
            })
    }
    catch(err){
        req.flash("error",err.message)
        res.redirect("/register")
    }
       
}