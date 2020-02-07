const sqlite3 = require('sqlite3').verbose();

	
let db = new sqlite3.Database('./db/fist.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the chinook database.');
});


let sql = `SELECT * from season`;

db.all(sql, [], (err, rows) => { if (err) { throw err; }
//   rows.forEach((row) => {console.log(row.name);});
    console.log(typeof rows)
});


db.close()