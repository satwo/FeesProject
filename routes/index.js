var express = require('express');
var router = express.Router();
var path = require('path');


function getBlockData(req, res, next){
  res.send(blockData);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Segwit vs Legacy Tx Comparison' });
  getBlockData(); 
});

module.exports = router;
