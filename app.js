const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const validator = require('validator')
const session = require('express-session')
const mongoDbSession = require('connect-mongodb-session')(session)

//imports of files
const UserSchema = require("./UserSchema");
const { cleanUpAndValidate } = require("./utils/AuthUtil");
const { isAuth } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 8000;
const saltRounds = 11;

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.set("view engine", "ejs");
mongoose.set("strictQuery", false);

const MongoURI = `mongodb+srv://lenson:Lenson27@cluster0.jfibqlk.mongodb.net/merntodo`;

//session
const store = new mongoDbSession({

    uri: MongoURI,
    collection: "sessions"
})

app.use(
    session({
        secret:"Code Grey",
        resave:false,
        saveUninitialized:false,
        store: store
    })
)

//mongodbconnection



mongoose
  .connect(MongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("Connected to MongoDb");
  })
  .catch((err) => {
    console.log(err);
  });

//get

app.get("/", (req, res) => {
  return res.send("This is my ToDO App");
});

app.get("/register", (req, res) => {
  return res.render("register");
});

app.get("/login", (req, res) => {
  return res.render("login");
});

//post

app.post("/register", async (req, res) => {
  //validate data
  const { name, email, password, username } = req.body;

  try {
    await cleanUpAndValidate({ name, password, username, email });
  } catch (error) {
    return res.send({
        status: 402,
        message: error
    })
  }




  //hash password
  const hashedPassword = await  bcrypt.hash(password, saltRounds )

  console.log(hashedPassword)

  //we need to create user

  let user = new UserSchema({
    name:name,
    email:email,
    password:hashedPassword,
    username:username
  })
//check if user is present or not

let userExists;
try{
   userExists = await  UserSchema.findOne({email: email})
}
catch(error)
{
    return res.send({
        status: 400,
        message:'Internal server error, please try again',
        error:error
    })
}

console.log(userExists)
if(userExists){
    return res.send({
        status: 403,
        message:'User already exists',
        
    })
}
//create user
  try{
    const userDb =  await user.save() //save in db, returns promise 
   //  console.log(userDb);
   
//   return res.send({
//     status: 200,
//     message: "Registration is successful",
//     data: req.body,
//   });
return res.status(200).redirect('/login')
  }
  catch(err){
    return res.send({
        status: 400,
        message:"Registration did not complete",
        error:err,
    })

  }

 


});

app.post("/login", async (req, res) => {

 const {loginId, password} = req.body;

if(!loginId || !password || typeof loginId !== 'string' || typeof password !== 'string'){
    return res.send({
        status: 400,
        message:'Invalid data'
    })
}

let userDb

try{
    if(validator.isEmail(loginId)){
       userDb = await UserSchema.findOne({email :loginId})
    }
    else{
        userDb = await UserSchema.findOne({username :loginId})

    }
    if(!userDb)
    {
        return res.send({
            status:401,
            message:"User not found. Please register first"
        })
    }
    //compare saved password with entered password
 const isMatch = await    bcrypt.compare(password, userDb.password)

 if(!isMatch){
    return res.send({
        status: 403,
        message:"Incorrect password",
        data: userDb
    })
 }

 //final return 
 req.session.isAuth = true;
 req.session.user={
    username: userDb.username,
    email: userDb.email,
    userId:userDb._id
 }

//  return res.send({
//     status: 200,
//     message:"Login successful",
//     data: userDb
//  })

return res.status(200).redirect('/home')

}
catch(error){

    return res.send({
        status: 400,
        message:"Database error",
        error: error,
    })

}

 
});


app.get('/home', isAuth, (req, res)=>{

    console.log(req.session)
    return res.send("This is Home Page");
})

app.get("/dashboard", isAuth, (req, res)=>{
 return res.render("dashboard")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
