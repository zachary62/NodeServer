const vega = require('vega')
const lite = require('vega-lite')
var express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const validator = require('express-validator')
const { check, validationResult } = require('express-validator/check')
const app = express()
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
var session = require('express-session');

// open the database
const db = new sqlite3.Database('./db/fist.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const middleware = [
  express.static(path.join(__dirname, 'public')),
  bodyParser.urlencoded(),
  validator(),
  cookieParser(),
  session({secret: "Your secret key"})
]
app.use(middleware)

// global variables used in template
let values = [
  {a: 'A', b: 28},
  {a: 'B', b: 55},
  {a: 'C', b: 43},
  {a: 'D', b: 91},
  {a: 'E', b: 81},
  {a: 'F', b: 53},
  {a: 'G', b: 19},
  {a: 'H', b: 87},
  {a: 'I', b: 52}
]
let session_id = 0;
let plot;
let validSql = "";
var yourVlSpec = {
  mark: 'bar',
  encoding: {
    x: {field: 'a', type: 'ordinal'},
    y: {field: 'b', type: 'quantitative'}
  }
};


VegaView(yourVlSpec).toSVG()
  .then(function(svg) {
    app.get('/', function(req, res){
      plot = svg
      // res.cookie('name', 'hello')
      // res.cookie('svg', 'asdasdasdasd asdasda asdasd')
      // console.log(svg.length)
      var newUser = {id: session_id ++, values: values, plot: plot, validSql: validSql,yourVlSpec: yourVlSpec};
      req.session.user = newUser;
      // console.log(req.session.values);
      res.render('start', {
        values: JSON.stringify( req.session.user.values,null,' '),
        plot:  req.session.user.plot,
        dataSql:  req.session.user.validSql,
        dataVega: JSON.stringify( req.session.user.yourVlSpec,null,' '),
        errorsSql: {},
        errorsVega: {}})
      
      
      })  
  })
  .catch(function(err) { console.error(err); });



  
app.post('/database', [check('sql').isLength({ min: 1 }).withMessage('sql  is required')],
 (req, res) => {
  // console.log(req.session.user);
  function dbRender() {
    res.render('start', {
      values: JSON.stringify(req.session.user.values,null,' '),
      plot: req.session.user.plot,
      dataSql: req.body.sql,
      dataVega: JSON.stringify(req.session.user.yourVlSpec,null,' '),
      errorsSql: errors,
      errorsVega: {}
    });
  }
  const errors = validationResult(req).mapped()
  // if a sql is provided, apply it to db
  if (Object.keys(errors).length === 0) {
    db.all(req.body.sql, [], (err, rows) => { 
      if (err) { errors.sql =  { msg: err } }
      else {
        req.session.user.values = rows
      }
      // store the sql if there is no error
      if (Object.keys(errors).length === 0) {req.session.user.validSql = req.body.sql}
      dbRender()
    });
  }
  else {
    // if there is an error
    dbRender()
  }
})



app.post('/Vega', [check('vega').isLength({ min: 1 }).withMessage('VegaLite  is required')],
 (req, res) => {
  function vegaRender() {
    res.render('start', {
      values: JSON.stringify(req.session.user.values,null,' '),
      plot: req.session.user.plot,
      dataSql: req.session.user.validSql,
      dataVega: req.body.vega,
      errorsSql: {},
      errorsVega: errors
  });}
  const errors = validationResult(req).mapped()
  // receive a vegalite spec
  // check whether we can successfully parse it
  if (Object.keys(errors).length === 0){
      try {
      temp = JSON.parse(req.body.vega);
      VegaView(temp).toSVG().then(function(svg) {
      req.session.user.plot = svg
      vegaRender()})
      // if no error, change the global vegalit
      req.session.user.yourVlSpec = temp
    } catch(err) {
      errors.vega = {  msg: err }
      vegaRender()
    }
  }
  // if having error receiving vegalite spec
  else{
    vegaRender()
  }
})

app.listen(3000, () => {
  console.log(`App running at http://localhost:3000`)
})

// receive an vegalite specification
// automatically bound data to global variable values
// return view
function VegaView(spec) {
  // make a copy of spec
  specCopy = Object.assign({}, spec)
  specCopy.data = {values}
  let vegaspec = lite.compile(specCopy).spec
  return  new vega.View(vega.parse(vegaspec), {renderer: "none"})
}