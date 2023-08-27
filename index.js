const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./db');
const session = require('express-session');
let alert = require('alert'); 
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/submit', (req, res) => {
  const no = req.body.no;
  const sub = req.body.sub;
  const cls = req.body.class;
  const hour = req.body.hour;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  const promises = [];

    const promise = new Promise((resolve, reject) => {
      connection.query(
        'INSERT INTO attendance (class, roll, sub, date, hour) VALUES (?, ?, ?, ?, ?)',
        [cls, no, sub, dateString, hour],
        (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
    promises.push(promise);

  Promise.all(promises)
    .then(() => {
      res.status(200).send('Record inserted successfully');
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error inserting record into database');
    });
});
app.post('/submit1', (req, res) => {
  const str = req.body.no;
  const reg=req.body.reg;
  const st = req.body.st;
  const en = req.body.en;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  const promises = [];
    const promise = new Promise((resolve, reject) => {
      connection.query(
        'INSERT INTO roll (class, regprefix,sroll, eroll) VALUES (?, ?, ?, ?)',
        [str,reg,st,en],
        (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
    promises.push(promise);
  Promise.all(promises)
    .then(() => {
      res.redirect('admin_class');
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error inserting record into database');
    });
});
app.post('/submit2', (req, res) => {
  const fnm = req.body.fnm;
  const fpno=req.body.fpno;
  const doj = req.body.doj;
  const nfid = req.body.nfid;
  const npassword = req.body.npassword;
  const promises = [];
    const promise = new Promise((resolve, reject) => {
      connection.query(
        'INSERT INTO faculty (fname,fid,phone,doj,password) VALUES (?, ?, ?, ? ,?)',
        [fnm,nfid,fpno,doj,npassword],
        (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
    promises.push(promise);
  Promise.all(promises)
    .then(() => {
      res.redirect('admin_dash');
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error inserting record into database');
    });
});
 
 app.post('/retrieve', async (req, res) => {
  try {
    let k1=req.body.class;
    let k2=req.body.st;
    let k3=req.body.en;
    const results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM attendance WHERE class = ? and date>=? and date <=? ', [k1,k2,k3], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    
    for(let i=0;i<results.length;i++){
      let cls=results[i].class;
      let no=results[i].roll;
      let sub =results[i].sub;
      let date=results[i].date;
      let hour=results[i].hour;
      if (no) { // Check if no is defined
        no = no.split(',');
        for(let i=0;i<no.length;i++){
          await new Promise((resolve, reject) => {
            connection.query('INSERT INTO attd (class,roll,sub,date,hour) VALUES (?, ?,?,?, ?)', [cls,no[i],sub,date,hour], (err, result) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                console.log(result);
                resolve(result);
              }
            });
          });
        }
      }
    }
    
    const roll = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM roll WHERE class = ?', [k1], (err, results) => {
        if (err) {
          reject(err);
        } else {
          const roll = results.map(result => [result.sroll, result.eroll]);
          resolve(roll);
        }
      });
    });
    
    const subjects = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM sub WHERE class = ?', [k1], (err, results) => {
        if (err) {
          reject(err);
        } else {
          const subjects = results.map(result => [result.sub, result.hour]);
          resolve(subjects);
        }
      });
    });

    const data = [];
    for (let i = roll[0][0]; i <= roll[0][1]; i++) {
      const arr = [i];
      for (let j = 0; j < subjects.length; j++) {
        const sub = subjects[j][0];
        const result = await new Promise((resolve, reject) => {
          connection.query(
            'SELECT * FROM attd WHERE class = ? AND roll = ? AND sub = ? AND date >= ? AND date <= ?',
            [k1, i, sub, k2, k3],
            (err, results) => {
              if (err) {
                reject(err);
              } else {
                const sum = results.reduce((acc, curr) => acc + curr.hour, 0);
                resolve(sum);
              }
            }
          );
        });
        const s = subjects[j][1] - result;
        arr.push(s);
      }
      data.push(arr);
    }
    await new Promise((resolve, reject) => {
      connection.query('DELETE FROM `attd` ',(err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log('perfect');
          resolve(results);
        }
      });
    });
    res.render('retrieve',{ data,subjects });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/sub', async (req, res) => {
  try {
          await new Promise((resolve, reject) => {
            connection.query('INSERT INTO faculty_sub (fid,sid,class) VALUES (?, ? ,?)', [req.body.sel1,req.body.sel,req.body.sel2], (err, result) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                console.log(result);
                resolve(result);
              }
            });
          });
    res.render('admin_dash');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
app.post('/submit3', async (req, res) => {
  try {
          await new Promise((resolve, reject) => {
            connection.query('INSERT INTO subjects (course_no,course_name) VALUES (?, ?)', [req.body.cno,req.body.cname], (err, result) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                console.log(result);
                resolve(result);
              }
            });
          });
    res.render('admin_dash');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
app.post('/retrieve1', async (req, res) => {
  try {
    let k1=req.body.class;
    let k2=req.body.roll;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const subjects = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM sub WHERE class = ?', [k1], (err, results) => {
        if (err) {
          reject(err);
        } else {
          const subjects = results.map(result => [result.sub, result.hour]);
          resolve(subjects);
        }
      });
    });

    const data = [];
    let i=k2;// student roll
    const results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM attendance WHERE class = ? and date <=? ', [k1,dateString], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    
    for(let i=0;i<results.length;i++){
      let cls=results[i].class;
      let no=results[i].roll;
      let sub =results[i].sub;
      let date=results[i].date;
      let hour=results[i].hour;
      if (no) { // Check if no is defined
        no = no.split(',');
        for(let i=0;i<no.length;i++){
          await new Promise((resolve, reject) => {
            connection.query('INSERT INTO attd (class,roll,sub,date,hour) VALUES (?, ?,?,?, ?)', [cls,no[i],sub,date,hour], (err, result) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                console.log(result);
                resolve(result);
              }
            });
          });
        }
      }
    }
      const arr = [i];
      for (let j = 0; j < subjects.length; j++) {
        const sub = subjects[j][0];
        const result = await new Promise((resolve, reject) => {
          connection.query(
            'SELECT * FROM attd WHERE class = ? AND roll = ? AND sub = ? AND date <= ?',
            [k1, i, sub, dateString],
            (err, results) => {
              if (err) {
                reject(err);
              } else {
                const sum = results.reduce((acc, curr) => acc + curr.hour, 0);
                resolve(sum);
              }
            }
          );
        });
        const s = subjects[j][1] - result;
        arr.push(s);
      }
      data.push(arr);
      await new Promise((resolve, reject) => {
        connection.query('DELETE FROM `attd` ',(err, results) => {
          if (err) {
            reject(err);
          } else {
            console.log('perfect');
            resolve(results);
          }
        });
      });
    res.render('retrieve1', { data,subjects });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
app.post('/retrieve2', async (req, res) => {
  try {
    let k1=req.body.class;
    let k2=req.body.st;
    const results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM attendance WHERE class = ? and date=?', [k1,k2], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    
    for(let i=0;i<results.length;i++){
      let cls=results[i].class;
      let no=results[i].roll;
      let sub =results[i].sub;
      let date=results[i].date;
      let hour=results[i].hour;
      if (no) { // Check if no is defined
        no = no.split(',');
        for(let i=0;i<no.length;i++){
          await new Promise((resolve, reject) => {
            connection.query('INSERT INTO attd (class,roll,sub,date,hour) VALUES (?, ?,?,?, ?)', [cls,no[i],sub,date,hour], (err, result) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                console.log(result);
                resolve(result);
              }
            });
          });
        }
      }
    }
    const subjects = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM sub WHERE class = ?', [k1], (err, results) => {
        if (err) {
          reject(err);
        } else {
          const subjects = results.map(result => [result.sub, result.hour]);
          resolve(subjects);
        }
      });
    });

    const data = [];
      for (let j = 0; j < subjects.length; j++) {
        const sub = subjects[j][0];
        const roll = await new Promise((resolve, reject) => {
          connection.query(
            'SELECT * FROM attd WHERE class = ? AND sub = ? AND date = ? ',
            [k1, sub, k2],
            (err, results) => {
              if (err) {
                reject(err);
              } else {
                const roll = results.map(result => result.roll);
                resolve(roll);
              }
            }
          );
        });
        data.push(roll);
      }
      await new Promise((resolve, reject) => {
        connection.query('DELETE FROM `attd` ',(err, results) => {
          if (err) {
            reject(err);
          } else {
            console.log('perfect');
            resolve(results);
          }
        });
      });
    res.render('retrieve2', { data,subjects });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
app.use(session(
{
  secret:"Your_Secret_Key",
  resave:true,
  saveUninitialized:true
}
));
app.get('/admin_login', (req, res) => {
  res.render('admin_login');
});
app.get('/admin_addsub', (req, res) => {
  if(req.session.aid)
  {
  res.render('admin_addsub');
  }
else{
  res.redirect('/');
}

});
app.get('/faculty_infobydate', async(req, res) => {
  if(req.session.fid)
    {
      let sfname=req.session.fname;
      let sfid=req.session.fid;
      let spassword=req.session.password;
      const row = await new Promise((resolve, reject) => {
        connection.query('SELECT DISTINCT * FROM faculty_sub WHERE fid= ?', [sfid], (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
      res.render('faculty_infobydate', { sfname,sfid,spassword,row});
    }
    else{
      res.redirect('/');
    }
});
app.get('/faculty_infobyroll', async(req, res) => {
  if(req.session.fid)
    {
      let sfname=req.session.fname;
      let sfid=req.session.fid;
      let spassword=req.session.password;
      const row = await new Promise((resolve, reject) => {
        connection.query('SELECT DISTINCT * FROM faculty_sub WHERE fid= ?', [sfid], (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
      res.render('faculty_infobyroll', { sfname,sfid,spassword,row});
    }
    else{
      res.redirect('/');
    }
});
app.get('/faculty_infobyclass', async(req, res) => {
  if(req.session.fid)
    {
      let sfname=req.session.fname;
      let sfid=req.session.fid;
      let spassword=req.session.password;
      const row = await new Promise((resolve, reject) => {
        connection.query('SELECT DISTINCT * FROM faculty_sub WHERE fid= ?', [sfid], (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
      res.render('faculty_infobyclass', { sfname,sfid,spassword,row });
    }
    else{
      res.redirect('/');
    }
});
app.get('/faculty_login', (req, res) => {
  res.render('faculty_login');
});
app.get('/faculty_class', (req, res) => {
  if(req.session.fid)
    {
      let sfname=req.session.fname;
      let sfid=req.session.fid;
      let spassword=req.session.password;
      res.render('faculty_class', { sfname,sfid,spassword });
    }
    else{
      res.redirect('/');
    }
});
app.get('/faculty_dash', (req, res) => {
  if(req.session.fid)
    {
      let sfname=req.session.fname;
      let sfid=req.session.fid;
      let spassword=req.session.password;
      res.render('faculty_dash', { sfname,sfid,spassword });
    }
    else{
      res.redirect('/');
    }
});
  app.post('/valid_admin', (req, res) => {
    const { uname, password } = req.body;
        const mysql = require('mysql');
    const connection = mysql.createConnection({ 
        host: 'localhost', 
        port: 3306,  
        database: 'attendance', 
        user: 'root', 
        password: 'root' });
    connection.connect(function (err) {
        if(err){
            console.log("error occurred while connecting");
            res.render('admin_login');
        }
        else{
            console.log("connection created with Mysql successfully");
            connection.query('SELECT * FROM admin WHERE admin_no = ? AND password = ?', [uname, password], function(err, rows) {
              if(err) throw err
              // if user not found
              if (rows.length <= 0) {
              alert("Invalid UserName or Password");
              res.redirect('admin_login');
              }
              else {
              req.session.aid=uname;
              req.session.password=password;
              res.render('admin_dash', { uname,password });
              }            
              })
        }
    });
  });
  app.post('/valid_faculty', (req, res) => {
    const { fid, password } = req.body;
        const mysql = require('mysql');
    const connection = mysql.createConnection({ 
        host: 'localhost', 
        port: 3306,  
        database: 'attendance', 
        user: 'root', 
        password: 'root' });
    connection.connect(function (err) {
        if(err){
            console.log("error occurred while connecting");
            res.render('faculty_login');
        }
        else{
            console.log("connection created with Mysql successfully");
            connection.query('SELECT * FROM faculty WHERE fid = ? AND password = ?', [fid, password], function(err, rows) {
              if(err) throw err
              // if user not found
              if (rows.length <= 0) {
              alert("Invalid UserName or Password");
              res.redirect('faculty_login');
              }
              else {
              req.session.fname=rows[0].fname;
              req.session.fid=fid;
              req.session.password=password;
              let sfname=req.session.fname;
              let sfid=req.session.fid;
              let spassword=req.session.password;
              res.render('faculty_dash', { sfname,sfid,spassword });
              }            
              })
        }
    });
  });
  app.get('/admin_dash', (req, res) => {
    if(req.session.aid)
    {
    res.render('admin_dash');
    }
    else{
      res.redirect('/');
    }
  });
  app.get('/admin_class', (req, res) => {
    if(req.session.aid)
    {
    res.render('admin_class');
    }
    else{
      res.redirect('/');
    }
  });
  app.get('/admin_faculty', (req, res) => {
    if(req.session.aid)
    {
    res.render('admin_faculty');
    }
    else{
      res.redirect('/');
    }
  });
  app.get('/admin_sub', async(req, res) => {
    if(req.session.aid)
    {
    try{
      const row = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM faculty', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      const row1 = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subjects', (err, rowss) => {
          if (err) {
            reject(err);
          } else {
            resolve(rowss);
          }
        });
      });
      const row2 = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM roll', (err, rowsss) => {
          if (err) {
            reject(err);
          } else {
            resolve(rowsss);
          }
        });
      });
      res.render('admin_sub',{row,row1,row2});
    }
    catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
    }
    else{
      res.redirect('/');
    }
  });
  app.get('/faculty_attendance', async(req, res) => {
    if(req.session.fid)
    {
    try{
      let sfname=req.session.fname;
      let sfid=req.session.fid;
      let spassword=req.session.password;
      const row = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM faculty_sub where fid=?',[req.session.fid], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      res.render('faculty_attendance',{row,sfname,sfid,spassword});
    }
    catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
    }
    else{
      res.redirect('/');
    }
  });
  app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});
app.listen(5000,()=>console.log("Server is Running"));