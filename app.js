const express = require('express');

const app = express();
const PORT = process.env.PORT || 8000;

app.set("view engine", "ejs");

app.get("/", (req, res)=>{
    return res.send("This is my ToDO App")
})


app.get("/register", (req, res)=>{
    return res.render("register");
})

app.get("/login", (req,res)=>{
    return res.render("login");
})

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})