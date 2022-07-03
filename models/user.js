/** User class for message.ly */
const db = reqire("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("..expressError");

const { BCRYPT_WORK_FACTOR } = require("../config"); //work factor: 12


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
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
      [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];

  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]);
      let user = result.rows[0];
      return user && (await bcrypt.compare(password, user.password));
  }
  

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users 
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username`,
      [username]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("User not found", 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(
      `SELECT username,
      first_name,
      last_name,
      phone
      FROM users
      ORDER BY username`
    );
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(
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

    if (!result.rows[0]){
      throw new ExpressError("User not found", 404);
    }

    return result.rows[0];

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
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

  static async messagesFrom(username) {
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
    return result.rows.map(message =>({
      id : message.id,
      to_user : {
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

  static async messagesTo(username) {
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
    return result.rows.map(message =>({
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