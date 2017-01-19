'use strict'

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');

let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.end('Short URL Generator - /url');
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_news');
});

app.get('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[shortURL]
  };
  console.log(req.params.id);
  res.render("urls_show", templateVars);
});


app.post('/urls/create', (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls/${newShortURL}`);
});

app.post("/urls/:id/update", (req, res) => {
  let shortURL = req.params.id;
  console.log(shortURL);
  console.log(urlDatabase);
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect('/urls')
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  console.log(urlDatabase);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}!`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

function generateRandomString() {
    let text = "";
    let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i=0; i < 6; i++ ) {
      text += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return text;
}
