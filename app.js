const path = require('path');

const express = require('express');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session');
const { ObjectId } = require('mongodb');

const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const mongoDBstore = mongodbStore(session);

const app = express();

const sessionStore = new mongoDBstore ({
  uri: 'mongodb://localhost:27017',
  databaseName: 'auth-demo',
  collection: 'sessions',
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'anees-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}));

app.use(async function(req, res, next) {
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;


if(!user || !isAuth){
  return next();
}
try {
  const userId = new ObjectId(user.id);
  const userDoc = await db.getDb().collection('users').findOne({_id: userId});
 
   if(!userDoc) {
    return next();
   }

  const isAdmin = userDoc.isAdmin;

  res.locals.isAuth = isAuth;
  res.locals.isAdmin = isAdmin;     //global variable set before we enter our main route

  next();
   } catch(error){
    return next(error);
   }
});

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.status(500).render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});