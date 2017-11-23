var express = require('express');
var router = express.Router();
var path = require('path');


function getBlockData(req, res, next){
  res.send(blockData);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'The Bitcoin Fees Project' });
  getBlockData(); 
});

module.exports = router;
