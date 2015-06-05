//modules needed
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs =require('fs');
var session = require('express-session')
var TasksQueue = require('tasks-queue');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var Twit = require('twit');
var busboy = require('connect-busboy');

//files needed
var routes = require('./routes/index');
var users = require('./routes/users');

//var Feed = require('./feed');


var app = express();
var q = new TasksQueue();

app.use(busboy()); 


var Bot;
var stream;

passport.use(new TwitterStrategy({
    consumerKey: "xQak0kLKC8PairSNCtWhpxgRi",
    consumerSecret: "LAz67w3c7Zi9Yz9x6MJ7uCmNcurGctc5ofRcvwCry7QsY72ozx",
    callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
		Bot = new Twit({
		  consumer_key: "xQak0kLKC8PairSNCtWhpxgRi",
		  consumer_secret:"LAz67w3c7Zi9Yz9x6MJ7uCmNcurGctc5ofRcvwCry7QsY72ozx",
		  access_token: token,
		  access_token_secret: tokenSecret
		});
		stream = Bot.stream('user');

        process.nextTick(function () {
      return done(null, profile);
    });

  }
));

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.use(bodyParser.json({uploadDir:'./uploads'}));

app.get('/auth/twitter', passport.authenticate('twitter'),function(res,req){});
app.get('/auth/twitter/callback',passport.authenticate('twitter', { successRedirect: '/',failureRedirect: '/auth/twitter' }),function(res,req){});

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}


//For messaging the followers
app.get('/follow',loggedIn,function(req,res,next){
console.log("Started the messaging proceess for the followers");
stream.on('follow', function (eventMsg) {
   var username = eventMsg.source.screen_name;
   Bot.post('direct_messages/new',{ screen_name: username, text:"Thank I changed text is that working"},function (err, data, response){
        if(err === null)
        {
          console.log("message posted");
        }
        else
        {
          console.log(err.message);
        }
  });
});
res.redirect('/');
});

app.post('/upload',loggedIn, function(req, res, next) {
 req.pipe(req.busboy);
   req.busboy.on('file', function(fieldname, file, filename) {
    var fstream = fs.createWriteStream('./files/' + filename); 
    file.pipe(fstream);
    fstream.on('close', function () {
       res.redirect('/bulktweet/'+filename);
    });
   });

}); 

q.setMinTime(9*1000);

//for bulkposting tweets
app.get('/bulktweet/:filename',loggedIn,function(req,res,next){
	var filename = req.params.filename;
	var buf = fs.readFileSync('./files/'+filename,'utf8');
 	var arr = buf.split('\n');
  	var status="Just Checking out the Twit node Package";
 	var tempstatus=status;
	  	for(var i=1;i<arr.length;i++)
		{
    		if(status.length+arr[i].length+2 > 140 )
    		{
      			q.pushTask('tweet-task',{buf:status});
      			status=tempstatus;  
    		}else if(i === arr.length-1){
      			q.pushTask('tweet-task',{buf:status});
      			status=tempstatus;
    		}
    		else
    		{
    	  		status=status+' @'+arr[i];
    		}
  		}  
  	q.execute();
  	res.redirect('/');
});


q.on('tweet-task',tweetProcess); 

function tweetProcess(jinn,data)
{
  var status=data.buf;
  console.log(status);
  Bot.post('statuses/update',{status: status},function(err,data,response){
    if(err){
      console.log(err.message);
    }
    else{
      console.log("Your Status Has Been Updated");
    }
  });
  jinn.done(); // important!
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




app.use('/', routes);
app.use('/users', users);






// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
