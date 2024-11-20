const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");


const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
let sessionInputData = req.session.inputData;

if(!sessionInputData) {    //if there is no session input data
  sessionInputData = {
    hasError: false,
    email: '',
    confirmEmail: '',
    password: '',
  };
};
 req.session.inputData = null;

  res.render("signup", {inputData: sessionInputData});  // setting inputData to real data stored in the session or sessionIputData if nothing is stored
});

router.get("/login", function (req, res) {
  let sessionInputData = req.session.inputData;

if(!sessionInputData) {    //if there is no session input data
  sessionInputData = {
    hasError: false,
    email: '',
    confirmEmail: '',
    password: '',
  };
};
 req.session.inputData = null;
  res.render("login", {inputData: sessionInputData});
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const enteredemail = userData.email;
  const eneteredconfirmEmail = userData["confirm-email"]; //to access properties that have - instead of just userData.confirmemail
  const enteredpassword = userData.password;

  if (
    !enteredemail ||
    !eneteredconfirmEmail ||
    !enteredpassword ||
    enteredpassword.trim() < 6 ||
    enteredemail !== eneteredconfirmEmail ||
    !enteredemail.includes("@")
  ) {

    req.session.inputData = {        //the the name inputData is up to you
     hasError: true,    //because the input data has an error
     message: 'Invalid input - please check your data.',
     email: enteredemail,
     confirmEmail: eneteredconfirmEmail,
     password: enteredpassword,
    };

    req.session.save(function() {
      // console.log("Incorrect data");
       res.redirect("/signup");
    })
    return;
  }
  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredemail });

    if(existingUser){
      req.session.inputData = {        //the the name inputData is up to you
        hasError: true,    //because the input data has an error
        message: 'User exists already!.',
        email: enteredemail,
        confirmEmail: eneteredconfirmEmail,
        password: enteredpassword,
       };
       req.session.save(function() {
         res.redirect("/signup");
       });
       return;
    }

  const harshedPassword = await bcrypt.hash(enteredpassword, 12);

  const user = {
    email: enteredemail,
    password: harshedPassword,
  };

  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredemail = userData.email;
  const enteredpassword = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredemail });

  if (!existingUser) {
    req.session.inputData = {        //the the name inputData is up to you
      hasError: true,    //because the input data has an error
      message: 'Could not log you in - please check your credentials!.',
      email: enteredemail,
      password: enteredpassword,
     };
     req.session.save(function(){
      res.redirect("/login");
     });
    return ;
  }

  const passwordsAreEqual = await bcrypt.compare(
    enteredpassword,
    existingUser.password
  );

  if (!passwordsAreEqual) {
    req.session.inputData = {        //the the name inputData is up to you
      hasError: true,    //because the input data has an error
      message: 'Could not log you in - please check your credentials!.',
      email: enteredemail,
      password: enteredpassword,
     };
     req.session.save(function(){
      res.redirect("/login");
     });
    return ;
  }

  console.log("User is authenticated!");


 req.session.user = { id: existingUser._id.toString(), email: existingUser.email, isAdmin: existingUser.isAdmin};  //this will be stored in the sessions collection, and they are authenticated request,not for validating a user to be stored in the database but to check if logged in or logged out8
 req.session.isAuthenticated = true;
 req.session.save(function(){
  res.redirect("/admin");
 });

});

router.get("/admin", async function (req, res) {
  if(!res.locals.isAuth) { // if (!req.session.user)
 return res.status(401).render('401');
  }


  if(!res.locals.isAdmin) {
   return res.status(403).render('403');
  }
  res.render("admin");
});

router.get("/profile", function (req, res) {
  if(!req.session.isAuthenticated) { // if (!req.session.useer)
 return res.status(401).render('401');
  }
  res.render("profile");
});


router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect('/');
});

module.exports = router;


