var express = require('express');
var router = express.Router();
const userModel = require("./users");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require('./multer')
const postModel = require('./posts');

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/profile', isLoggedIN, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate('posts')
res.render('profile', {user});
})

router.get('/uploadpost', isLoggedIN, function (req, res, next) {
res.render('uploadpost');
})

router.get('/showPosts', isLoggedIN, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate('posts')
res.render('showpost', {user});
})

router.get('/login', function (req, res, next) {
  res.render('login', {error: req.flash('error')});
})

router.get('/feed',isLoggedIN, async function (req, res, next) {
  const posts = await postModel.find();
  const usersList = await userModel.find();
  // let userArray = [];
  // userList.forEach(user => {
  //   let key = user._id 
  // });
  console.log(usersList);
  res.render('feed',{posts});
})

router.post('/upload', isLoggedIN, upload.single('file'), async function (req, res, next) {
  if(!req.file){
    return res.status(400).send('No files uploaded');
  }
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile')
})

router.post('/dpupload', isLoggedIN, upload.single('file'), async function (req, res, next) {
  if(!req.file){
    return res.status(400).send('No files uploaded');
  }
  const user = await userModel.findOne({username: req.session.passport.user});
  user.dp = req.file.filename;
  await user.save();
  res.redirect('/profile')
})


router.post('/register',function(req, res){
  const {username, email, fullname} = req.body;
  const userData = new userModel({username, email, fullname});
  userModel.register(userData,req.body.password)
  .then(function(){
    passport.authenticate('local')(req, res, function(){
      res.redirect("/profile");
    })
  })
})

router.post('/login', passport.authenticate('local', {
  successRedirect:'/profile',
  failureRedirect:'/login',
  failureFlash: true
}), function(req, res){

})

router.get('/logout', function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function isLoggedIN(req, res, next) {
  if(req.isAuthenticated()) return next();
  res.redirect('/login');
}

module.exports = router;
