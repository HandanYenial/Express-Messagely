const jwt = require("jsonwebtoken");
const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const { SECRET_KEY, DB_URI, BCRYPT_WORK_FACTOR } = require("../config");
const ExpressError = require("../expressError");




/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login" , async function(req,res,next){
    try{
        if(!username || !password){
            throw new ExpressError("Please provide username and password", 400);
        }
        // then we need to check if the user exists in the database
        //we don't have an id in our datbase so we need to use username
const results = await DB_URI.query(`
       SELECT username,password
       FROM users
       where username = $1`,
       [username] //this is the username that we are looking for in the database
    );
    //then we need to check if the password is correct
    const user = results.rows[0];
    if(user) { // if we have that user we rae looking for in our database
        if(await BCRYPT_WORK_FACTOR.compare(password,user.password)){
            //if the password is correct we need to create a token
            const token = jwt.sign({username}, SECRET_KEY);
            //then we need to update the last login timestamp
            //await DB_URI.query(`
                //UPDATE users
              //  SET last_login_at = current_timestamp
               // WHERE username = $1
              //  RETURNING username`,
              //  [username]
            User.updateLoginTimestamp(username); // we already have updateLoginTimestamp in the user
            //model, so I don't need to write it as above.
        }
            res.json({token}); //
        } else { //if the password is incorrect we need to throw an error
            throw new ExpressError("Invalid username or password", 400);
        }

    }catch(err){
        return next(err);
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */


router.post('/register' , async function(req,res,next){
    try {
        let { username } = await User.register(req.body); //we are passing in the request body
        let token = jwt.sign({ username } , SECRET_KEY); //we are signing the token with the secret key
        User.updateLoginTimestamp(username); //we are updating the last login timestamp(from User class updateLoginTimestamp method)
        return res.json({token}); // return the token
    } catch (err) {
        return next(err);
    }

});





module.exports = router;