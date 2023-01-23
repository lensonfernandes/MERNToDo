const validator = require('validator')

const cleanUpAndValidate = ({name, email, password, username}) => {
    return new Promise((resolve, reject)=>{
        if(typeof email !== "string") reject("Invalid email")
        if(typeof name !== "string") reject("Invalid Name")
        if(typeof password !== "string") reject("Invalid Password")
        if(typeof username !== "string") reject("Invalid Username")

        if(!email || !password || !username) reject("Missing Parameters")

        if(!validator.isEmail(email)) reject("Invalid Email Format")
        if( username.length < 2 || username.length >50) reject ("Username length should be between 3 and 49")
        if( password.length < 4 ) reject ("Password too short")
        if(password.length > 50 ) reject ("Password too long");

        resolve();
    })

}

module.exports ={cleanUpAndValidate}