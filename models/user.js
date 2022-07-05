/** User class for message.ly */
const db = require("../db");
const bcrypt = require("bcrypt"); // for hashing passwords
const ExpressError = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config"); //work factor: 12 


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  //users table: username, password, first_name, last_name, phone, join_at, last_login_at
  
  static async register({username, password, first_name, last_name, phone}) { //register method for User class
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);//first hash the password
    const result = await db.query( //then register the user by inserting the values into the database
      `INSERT INTO users(
      username,
      password,
      first_name,
      last_name,
      phone,
      join_at,
      last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username,hashedPassword, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone] //values to insert
    );
    return result.rows[0]; //return the rows of the result(registered user)

  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { ///authenticate method for User class
    const result = await db.query( //query the database for the user
      `SELECT password FROM users WHERE username = $1`,
      [username]); // get the password from the database for a specific user
      let user = result.rows[0]; //get the user from the result
      return user && (await bcrypt.compare(password, user.password)); //compare the password with the hashed password
  }
  

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { //update the last login timestamp for the user
    const result = await db.query( //query the database for the user
      `UPDATE users 
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username`,
      [username]
    );
    if (result.rows.length === 0) { //if the user does not exist
      throw new ExpressError("User not found", 404); //throw an error
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { //get all users
    const result = await db.query( //query the database for all users/Can also use SELECT * FROM users
      `SELECT username,
      first_name,
      last_name,
      phone
      FROM users
      ORDER BY username`
    );
    return result.rows; // return all users
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {  //get the user by username
    const result = await db.query( //query the database for the user
      `SELECT username,
      first_name,
      last_name,
      phone,
      join_at,
      last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (!result.rows[0]){ //if the user does not exist
      throw new ExpressError("User not found", 404); //throw an error
    }

    return result.rows[0]; //return the user

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  //messages table (id, from_username, to_username, body, sent_at, read_at)
  //users table (username, password, first_name, last_name, phone, join_at, last_login_at)

  static async messagesFrom(username) {//get the messages from the user

    // username is the param coming from the route

    // Then you query the DB for all messages sent by username
    const result = await db.query( 
      `SELECT 
      messages.id,
      messages.to_username,
      messages.body,
      messages.sent_at,
      messages.read_at
      users.username,
      users.first_name,
      users.last_name,
      users.phone
      FROM messages
      JOIN users ON messages.to_username = users.username
      WHERE from_username =$1`,
      [username]
    );

    // (SQL) - DB -> Table -> Rows -> Columns
    // (JS) - Table -> Rows -=> Array of Objects
    // [{001, "Bob", "Hello", "2020-01-01", "2020-01-01"}, ...]

    // FRONTEND: HTML/CSS/JS (Vanilla/React/Angular/Vue) -> AJAX (Fetch/Axios) -> Consume the API
    // BACKEND: Express/Flask/SpringBoot/.NET -> SQL/NoSQL (Postgres/MongoDB) -> API (Route -> Model -> REturn JSON)

    // The result.rows is an array of objects.
    return result.rows.map(message =>({  //map the result to an array of objects
      id : message.id,
      to_user : { //getting the values from the database
        username : message.username,
        first_name : message.first_name, 
        last_name : message.last_name,
        phone : message.phone
      },
    body : message.body,
    sent_at : message.sent_at,
    read_at : message.read_at
      }));
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */
  //CREATE TABLE messages (
  //  id SERIAL PRIMARY KEY,
  //  from_username text NOT NULL REFERENCES users,
  //  to_username text NOT NULL REFERENCES users,
  //  body text NOT NULL,
  //  sent_at timestamp with time zone NOT NULL,
  //  read_at timestamp with time zone
//);

  static async messagesTo(username) { //get the messages to the user//messages sent to the user
    const result = await db.query( 
      `SELECT 
      messages.id,
      messages.from_username,
      messages.body,
      messages.sent_at,
      messages.read_at
      users.first_name,
      users.last_name,
      users.phone
      FROM messages 
      JOIN users ON messages.from_username = users.username
      WHERE to_username = $1`,
      [username]
    );
    return result.rows.map(message =>({ //map the result to an array of objects
      id : message.id,
      from_user : {
        username : message.username,
        first_name : message.first_name,
        last_name : message.last_name,
        phone : message.phone
      },
    body : message.body,
    sent_at : message.sent_at,
    read_at : message.read_at
      }));
    }
  }



module.exports = User;