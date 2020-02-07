const vega = require('vega')
const lite = require('vega-lite')
var express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const validator = require('express-validator')
const { check, validationResult } = require('express-validator/check')
const app = express()
const sqlite3 = require('sqlite3').verbose();


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


app.listen(3000, () => {
  console.log(`App running at http://localhost:3000`)
})
