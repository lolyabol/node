const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.redirect('/index'); 
});

app.get('/index', (req, res) => {
    res.render('index');
});

app.post('/index', (req, res) => {
    const { username, email, password } = req.body;

    console.log(`Пользователь зарегистрирован: ${username}, Email: ${email}`);

    res.redirect('/Login'); 
});

app.get('/Login', (req, res) => {
    res.render('Login'); 
});

app.post('/Login', (req, res) => {
    const { username, password } = req.body;

    console.log(`Пользователь пытается войти: ${username}`);
    res.send('Вход выполнен!');
});

app.listen(port, () => {
    console.log(`Сервер запущен по адресу http://localhost:${port}`);
});
