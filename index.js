const express = require('express');
const app = express();
const port = 8081;
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const GitHubStrategy = require('passport-github').Strategy;

app.use(session({ secret: "supersecret", resave: true, saveUninitialized: true }));

let Users = [{'login': 'admin', 'email':'Aks-fam@yandex.ru'},
            {'login': 'local_js_god', 'email':'ilia-gossoudarev@yandex.ru'},
            {'login': 'student', 'email':'osnatap@yandex.ru'},
            {'login': 'git_user', 'id': '54999570'}];

const findUserByLogin = (login) => {
    return Users.find((element)=> {
        return element.login == login;
    })
}

const findUserByEmail = (email) => {
    return Users.find((element)=> {
        return element.email.toLowerCase() == email.toLowerCase();
    })
}

const findUserById = (id) => {
    return Users.find((element)=> {
        return element.id == id;
    })
}

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user.login);
  });
  //user - объект, который Passport создает в req.user
passport.deserializeUser((login, done) => {
    user = findUserByLogin(login);
        done(null, user);
});

passport.use(new YandexStrategy({
    clientID: '42f2962aa9b44bfeb84be6ff3d979c4d',
    clientSecret: '603f0a16db9c4b34bafe33af961402fd',
    callbackURL: "http://localhost:8081/auth/yandex/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);

    done(true, null);
  }
));

passport.use(new GitHubStrategy({
    clientID: '0a2aac7f0fa0d770e1af',
    clientSecret: '76de6bf832cbeeeda617abed99ee7b63781180ce',
    callbackURL: "http://localhost:8081/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    /*User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return cb(err, user);
    });*/
    let user = findUserById(profile.id);
    user.profile = profile;
    if (user) return cb(null, user);

    done(true, null);
  }
));

const isAuth = (req, res, next)=> {
    if (req.isAuthenticated()) return next();

    res.redirect('/sorry');
}


app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'main.html'));
});
app.get('/sorry', (req, res)=> {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});
app.get('/auth/yandex', passport.authenticate('yandex'));

app.get('/auth/yandex/callback', passport.authenticate('yandex', { failureRedirect: '/sorry', successRedirect: '/private' }));

app.get('/private', isAuth, (req, res)=>{
    res.send(req.user);
});

app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/sorry' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/private');
  });



app.listen(port, () => console.log(`App listening on port ${port}!`))