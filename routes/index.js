var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/login', function(req, res, next) {
  res.render('index', { title: 'Twitter-Bot' });
});

router.get('/', function(req, res, next) {
  res.render('home', { title: 'Twitter-Bot' });
});

router.get('*', function(req, res, next) {
  res.send('<h1> Bad Route </h1>');
});

module.exports = router;
