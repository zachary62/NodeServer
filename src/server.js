const vega = require('vega')
const lite = require('vega-lite')
var express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const validator = require('express-validator')
const { check, validationResult } = require('express-validator/check')
const app = express()
const sqlite3 = require('sqlite3').verbose();

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
  validator()
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
let plot;
var yourVlSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v2.0.json',
  description: 'A simple bar chart with embedded data.',
  data: {
    values
  },
  mark: 'bar',
  encoding: {
    x: {field: 'a', type: 'ordinal'},
    y: {field: 'b', type: 'quantitative'}
  }
};
let vegaspec = lite.compile(yourVlSpec).spec
var view = new vega.View(vega.parse(vegaspec), 
{renderer: "none"})

view.toSVG()
  .then(function(svg) {
    app.get('/', function(req, res){
      plot = svg
      res.render('start', {
        values: JSON.stringify(values,null,' '),
        plot: svg,
        dataSql: {},
        dataVega: {},
        vegalite: JSON.stringify(yourVlSpec,null,' '),
        errorsSql: {},
        errorsVega: {}})})
  })
  .catch(function(err) { console.error(err); });

app.post('/database', [check('sql').isLength({ min: 1 }).withMessage('sql  is required')],
 (req, res) => {
  
  const errors = validationResult(req).mapped()

  // if a sql is provided, apply it to db
  if (Object.keys(errors).length === 0) {
    db.all(req.body.sql, [], (err, rows) => { 
      if (err) { errors.sql =  { msg: err } }
      else {
        values = rows
      }
      res.render('start', {
        values: JSON.stringify(values,null,' '),
        plot: plot,
        dataSql: req.body.sql,
        dataVega: {},
        vegalite: JSON.stringify(yourVlSpec,null,' '),
        errorsSql: errors,
        errorsVega: {}
      })
    });
  }
  else {
    res.render('start', {
      values: values,
      plot: plot,
      dataSql: req.body.sql,
      dataVega: {},
      vegalite: JSON.stringify(yourVlSpec,null,' '),
      errorsSql: errors,
      errorsVega: {}
    })
  }
})

app.post('/Vega', [check('vega').isLength({ min: 1 }).withMessage('VegaLite  is required')],
 (req, res) => {
  console.log(req.body);
  const errors = validationResult(req).mapped()
  console.log(errors)
  if (Object.keys(errors).length === 0){
      try {
      temp = JSON.parse(req.body.vega);
    } catch(err) {
      errors.parse = {  msg: err }
    }
  }
  res.render('start', {
    values: values,
    plot: plot,
    dataSql: {},
    dataVega: req.body.vega,
    vegalite: JSON.stringify(yourVlSpec,null,' '),
    errorsSql: {},
    errorsVega: errors
  })
})

app.listen(3000, () => {
  console.log(`App running at http://localhost:3000`)
})
