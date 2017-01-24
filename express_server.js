'use strict'
//express setup
const express = require('express');
const app = express();
//body-parser setup
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
//bcrypt setup
const bcrypt = require('bcrypt');
//cookie-session setup
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['Testsession']
}));
//ejs setup
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

//port setup
const PORT = process.env.PORT || 3000;

let urlDatabase = {};

let users = {
  // 'id' : ,
  // 'email': ,
  // 'password': ,
  // 'urlList': {}
};

function generateRandomString(num) {
    let text = "";
    let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i=0; i < num; i++ ) {
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
  const userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const userId = req.session.user_id;

  if (userId) {
    let templateVars = {
      userId: req.session.user_id,
      users: users,
      userEmail: searchUserEmail(req.session.user_id),
      userData: users[userId].urlList
     };

    res.render('urls_index', templateVars);
  } else {
    return res.status(401).redirect('/login');
  }
});

// POST request for login
app.get('/login', (req, res) => {
  const userId = req.session.user_id;

  if (userId) {
    res.redirect('/');
  } else {
    let templateVars = {
      userId: req.session.user_id,
      'users': users,
      userEmail: searchUserEmail(req.session.user_id)
    };
    res.render('urls_login', templateVars);
  }
});

// POST request for login
app.post('/login', (req, res) => {
  const emailInput = req.body.email;
  const pwdInput = req.body.password;
  const userId = searchUserId(emailInput);

  if (users.hasOwnProperty()) {
    res.redirect('/');
    return;
  }

  for (let item in users) {
    if (users[item].email === emailInput && bcrypt.compareSync(pwdInput, users[item].password)) {
      req.session.user_id = userId;
      res.redirect('/');
    } else {
      res.status(401).send('Invalid User or Password');
      return;
    }
  }
});

// POST /logout
app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/');
});

// GET /register
app.get('/register', (req, res) => {
  const userId = req.session.user_id;

  if (userId) {
    res.redirect('/');
  } else {
    let templateVars = {
      userId: req.session.user_id,
      'users': users,
      userEmail: searchUserEmail(req.session.user_id)
    };
    res.render('urls_regs', templateVars);
  }
});

// POST /register
app.post('/register', (req, res) => {
  const emailInput = req.body.email;
  const userRandomId = generateRandomString(10);
  const pwdInput = req.body.password;
  const hashed_password = bcrypt.hashSync(pwdInput, 10);

  for (let item in users) {
    if (users[item].email === emailInput) {
      res.status(400).send('email exists already');
      return;
    }
  }

// check if email or password is empty
  if (emailInput.trim().length === 0 || pwdInput.trim().length === 0) {
    res.status(400).send('Invalid email or password');
    return;
  } else { // add user to users object
    users[userRandomId] = {
      'id': userRandomId,
      'email': emailInput,
      'password': hashed_password,
      'urlList': {}
    };
  // add user_id to cookie
    req.session.user_id = userRandomId;
    res.redirect('/');
  }
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    userId: req.session.user_id,
    'users': users,
    userEmail: searchUserEmail(req.session.user_id)
  };

  if(templateVars.userId) {
   res.status(200).render('urls_news', templateVars);
  } else {
    res.status(401).redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.user_id;

  if (!userId) {  /* || user id is invalid */
    res.status(401).redirect('/login');
    return;
  } // else...

  const keyArr = Object.keys(urlDatabase);
  const userUrlArr = Object.keys(users[userId].urlList);

  function compareUrl (urlKey) {
    return urlKey === shortURL;
  }

  if (keyArr.filter(compareUrl).length === 0) {
    res.status(404).send("<html>Please input parameter.</html>");
  } else if (shortURL !== userUrlArr.filter(compareUrl)[0]) { // alt - } else if (users[userId].urlList[shortUrl] !== undefined) {
    res.status(403).send("<html>This url is not created by you.</html>");
    return;
  }
  let templateVars = {
    shortURL: req.params.id,
    userId: req.session.user_id,
    'users': users,
    userEmail: searchUserEmail(req.session.user_id),
    userData: users[userId].urlList
  };
  res.render("urls_show", templateVars);
});

app.post('/urls', (req, res) => {
  const userId = req.session.user_id;
  const newShortURL = generateRandomString(6);

  if (req.session.user_id === undefined) {
    return res.redirect('/');
  } else {
    urlDatabase[newShortURL] = req.body.longURL;
    users[userId].urlList[newShortURL] = req.body.longURL;
    res.redirect(`/urls/${newShortURL}`);
  }
});

app.post('/urls/:id/update', (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.user_id;

  if (!userId) {  /* || user id is invalid */
    res.status(401).redirect('/login');
    return;
  }

  const keyArr = Object.keys(urlDatabase);
  const userUrlArr = Object.keys(users[userId].urlList);

  function compareUrl (urlKey) {
    return urlKey === shortURL;
  }

  if (keyArr.filter(compareUrl).length === 0) {
    res.status(404).send("<html>Please input parameter.</html>");
  } else if (shortURL !== userUrlArr.filter(compareUrl)[0]) {
    res.status(403).send("<html>This url is not created by you.</html>");
    return;
  }

  urlDatabase[shortURL] = req.body.longURL;
  users[userId].urlList[shortURL] = req.body.longURL;
  res.redirect('/urls');

});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.user_id;

  if (!userId) {  /* || user id is invalid */
    res.status(401).redirect('/login');
    return;
  }

  const keyArr = Object.keys(urlDatabase);
  const userUrlArr = Object.keys(users[userId].urlList);

  function compareUrl (urlKey) {
    return urlKey === shortURL;
  }

  if (keyArr.filter(compareUrl).length === 0) {
    res.status(404).send("<html>Please input parameter.</html>");
  } else if (shortURL !== userUrlArr.filter(compareUrl)[0]) {
    res.status(403).send("<html>This url is not created by you.</html>");
    return;
  }

  let userData = users[userId].urlList;
  delete userData[shortURL];
  res.redirect(`/urls`);

});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (shortURL && (longURL.substring(0,7) === 'http://')) {
    res.redirect(longURL);
  } else if (shortURL && (longURL.substring(0,7) !== 'http://')) {
    res.redirect('http://' + longURL);
  } else {
    res.status(404).send('No links exists.');
  }
});

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}!`);
});




