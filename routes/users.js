const Router = require("express").Router;
const router = new Router();
const { ensureLoggedIn , ensureCorrectUser } =require("../middleware/auth");
const User = require("../models/user");


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/" , ensureLoggedIn , async function(req,res,next){
    try{
        const users = await User.all(); // we already have all in the user model
        return res.json({users});
    } catch (err) {
        return next(err);
    }
});


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username" , ensureCorrectUser , async function(req,res,next){ //since we don't have an id in the users table
    try{
        const user = await User.get(req.params.username); // we already have get in the user model
        return res.json({ user });
    } catch (err) {
        return next(err);
    }

});


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/to" , ensureCorrectUser, async function(req,res,next){
    try{
        let messages = await User.messagesTo(req.params.username);
        return res.json ({ messages });
        }
        catch (err) {
            return next(err);
        }
    });

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from" , async function(req,res,next){
    try{
        let messages = await User.messagesFrom(req.params.username);
        return res.json ({ messages });
        }
        catch (err) {
            return next(err);
        }
    });