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
const ToDoModel = require("./models/ToDoModel");

const app = express();
const PORT = process.env.PORT || 8000;
const saltRounds = 11;

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));



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

return res.status(200).redirect('/dashboard')

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

app.get("/dashboard", isAuth, async (req, res)=>{

    
    const username = req.session.user.username;
    let todos = []

    try{
         todos = await ToDoModel.find({username: username})

        // if(todo.length === 0)
        // {
        //     return res.send({
        //         status: 400,
        //         message:"There's no todo, please create some"
        //     })
        // }
    }
    catch(error){
        return res.send({
            
            status: 400,
            message:"Error Occured",
            error: error
        })

    }
 return res.render("dashboard", {todos: todos})
})

 

app.post("/logout", isAuth, (req,res)=>{
console.log(req.session);
req.session.destroy((err)=>{
    if(err) throw err;

    res.redirect("/login")
}

)

})

app.post("/logout_from_all_devices",isAuth, async (req, res)=>{

    const username = req.session.user.username;

    //session schema
    const Schema = mongoose.Schema;
    const sessionSchema = new Schema({_id: String}, {strict: false})
    const SessionModel = mongoose.model("session", sessionSchema)

    try{
       const sessionDb =  await SessionModel.deleteMany({

        "session.user.username": username

        })

        return res.send({
            status: 200,
            message:"Logged out from all devices successful"
        })

    }
    catch(error){
return res.send({
    status: 400,
    message:"Log out Operation failed" 
})
    }
})

//todo routes

app.post("/create-item", isAuth, async (req,res)=>{
    console.log(req.body.todo)

    const todoText = req.body.todo;

    if(!todoText){
        return res.send({
            status: 400,
            message: "Missing paramters"
        })
    }
    if(typeof todoText !== 'string'){
        return res.send({
            status: 400,
            message: "Todo entered is not a string"
        })
    }


    if(todoText.length > 100)
    {
        return res.send({
            status: 400,
            message:"ToDo is too long"
        })
    }

    let todo = new ToDoModel({
        todo: todoText,
        username: req.session.user.username,
    })

    try{
       const todoDb =  await todo.save();
       return res.send({
        status: 201,
        message:"ToDo created",
        data: todoDb
       })

    }
    catch(error){
        return res.send({
            status: 500,
            message:"ToDo creation didnt complete",
            error: error
           })
    }
})

app.post('/edit-item', async (req,res)=>{
    const id = req.body.id;
    const newData = req.body.newData;

    console.log(req.body);

    if(!id || !newData){
        return res.send({
            status: 400,
            message: "Missing parameters"
        })
    }
    if(typeof newData !== 'string'){
        return res.send({
            status: 400,
            message: "Todo entered is not a string"
        })
    }


    if(newData.length > 100)
    {
        return res.send({
            status: 400,
            message:"ToDo is too long"
        })
    }

    try{
        const todoDb = await ToDoModel.findOneAndUpdate({_id: id}, {todo: newData})
        if(!todoDb)
        {
            return res.send({
                status: 404,
                message:"ToDo not found",
                data: todoDb
               })
        }
        return res.send({
            status: 200,
            message:"ToDo Updated successfully",
            data: todoDb
           })
    }
    catch(error){
        return res.send({
            status: 500,
            message:"ToDo update didnt complete",
            error: error
           })
    }
})

app.post('/delete-item', async(req,res)=>{
    const id = req.body.id;
    console.log(req.body);

    if(!id){
        return res.send({
            status: 400,
            message: "Missing parameters"
        })
    }
    try{
        const todoDb = await ToDoModel.findOneAndDelete({_id: id})
        return res.send({
            status: 200,
            message:"Deleted successfully",
            data: todoDb
           })
    }
    catch(error){
        return res.send({
            status: 500,
            message:"Delete operation didnt complete",
            error: error
           })
    }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
