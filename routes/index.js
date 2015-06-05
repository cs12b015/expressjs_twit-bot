var express = require('express');
var router = express.Router();

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}
/* GET home page. */
router.get('/',loggedIn, function(req, res, next) {
  res.render('index', { title: 'Twitter-Bot' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Twitter-Bot' });
});

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

router.get('*',loggedIn, function(req, res, next) {
  res.send('<h1> Bad Route </h1>');
});

module.exports = router;
