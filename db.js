const mysql = require('mysql');
const connection =  mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance'
  });
  connection.connect((err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log('Connected to MySQL database');
  });
module.exports = connection;