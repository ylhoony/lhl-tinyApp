'use strict'

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// var cookieParser = require('cookie-parser');
// app.use(cookieParser());

const bcrypt = require('bcrypt');

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['Testsession']

}))


const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');

let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

let users = {};

function generateRandomString() {
    let text = "";
    let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i=0; i < 6; i++ ) {
      text += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return text;
}

function generateRandomId() {
    let text = "";
    let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i=0; i < 15; i++ ) {
      text += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return text;
}

function searchUserId (userEmail) {
  for (let item in users) {
    if (users[item].email === userEmail)
      return users[item].id;
  }
}

function searchUserEmail (userId) {
  for (let item in users) {
    if (users[item].id === userId)
      return users[item].email;
  }
}

app.get('/', (req, res) => {
  res.end('Short URL Generator - /url');
});

app.get('/urls', (req, res) => {
  const userId = req.session.user_id;
  console.log(userId);
  if (userId === undefined) {
    return res.status(401).redirect('/login');
  } else {
    let templateVars = {
      userId: req.session.user_id,
      urls: urlDatabase,
      users: users,
      userEmail: searchUserEmail(req.session.user_id),
      userData: users[userId].urlList
     };

    res.render('urls_index', templateVars);
  }
});


// POST request for login
app.get('/login', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    userId: req.session.user_id,
    'users': users,
    userEmail: searchUserEmail(req.session.user_id)
   };
  // console.log(req.cookies.user_id);
  res.render('urls_login', templateVars);

});



// POST request for login
app.post('/login', (req, res) => {
  const emailInput = req.body.email;
  const pwdInput = req.body.password;
  let userId = searchUserId(emailInput);


  for (let item in users) {
    if (users[item].email === emailInput && bcrypt.compareSync(pwdInput, users[item].password)) {
      req.session.user_id = userId;
      // res.cookie('user_id', userId);
      res.redirect('/');
    } else {
      res.status(403).send('Invalid User or password');
    }
  }
});

// POST /logout
app.post('/logout', (req, res) => {
  // res.redirect('urls');
  res.clearCookie('session', 'session.sig');
  res.redirect('/urls');
});

// GET /register
app.get('/register', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    userId: req.session.user_id,
    'users': users,
    userEmail: searchUserEmail(req.session.user_id)
   };
  // console.log('GET /register');
  // console.log(searchUserEmail(req.cookies.user_id));
  res.render('urls_regs', templateVars);
});
//

// POST /register
app.post('/register', (req, res) => {
  let emailInput = req.body.email;
  let userRandomId = generateRandomId();

  const pwdInput = req.body.password; // you will probably this from req.params
  const hashed_password = bcrypt.hashSync(pwdInput, 10);

  for (let item in users) {
    if (users[item].email === emailInput) {
      return res.status(400).send('email exists already');
    }
  }

// check if email or password is empty
  if (emailInput.trim().length === 0 || pwdInput.trim().length === 0) {
    return res.status(400).send('invalid email or password');

  } else { // add user to users object - 1
    users[userRandomId] = {
      'id': userRandomId,
      'email': emailInput,
      'password': hashed_password,
      'urlList': {}
    };
  // add user_id to cookie - 1
    req.session.user_id = userRandomId;
    // res.cookie('user_id', userRandomId);
    res.redirect('back');
  }
  console.log(users);
  console.log(userRandomId);
  // console.log(req.body.email);
  // console.log(req.body.password);

});
//

app.get('/urls/new', (req, res) => {
  let templateVars = {
    userId: req.session.user_id,
    'users': users,
    userEmail: searchUserEmail(req.session.user_id)
  };
  if(templateVars.userId) {
   res.render('urls_news', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.get('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[shortURL],
    userId: req.session.user_id,
    'users': users,
    userEmail: searchUserEmail(req.session.user_id)
  };

  if(req.session.user_id === undefined) {
    return res.status(401).redirect('/login');
  } else{
  // console.log(req.params.id);
  res.render("urls_show", templateVars);
  }
});


app.post('/urls/create', (req, res) => {
  let userId = req.session.user_id;
  let newShortURL = generateRandomString();

  console.log(newShortURL);

  if (req.session.user_id === undefined) {
    return res.redirect('/');
  } else {

    urlDatabase[newShortURL] = req.body.longURL;

    users[userId].urlList[newShortURL] = req.body.longURL;

    res.redirect(`http://localhost:8080/urls/${newShortURL}`);

  }
  console.log(urlDatabase);
  console.log(users);


});

app.post("/urls/:id/update", (req, res) => {
  let shortURL = req.params.id;
  // console.log(shortURL);
  // console.log(urlDatabase);
  urlDatabase[shortURL] = req.body.longURL;
  // console.log(urlDatabase);
  res.redirect('/urls')
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  let userId = req.session.user_id;

  console.log(userId);

  if (userId === undefined) {
    res.send('you are not authorized')
  } else {
    let userData = users[userId].urlList;
    delete userData[shortURL];
    res.redirect('/urls');
  }
  // console.log(urlDatabase);

});

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}!`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


