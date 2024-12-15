const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключение к базе данных успешно.');

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            address TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            services TEXT NOT NULL,
            pay TEXT NOT NULL
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            address TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            services TEXT NOT NULL,
            pay TEXT NOT NULL,
            status TEXT
        )`);
        
    }
});



app.get('/', (req, res) => res.redirect('/registration'));

app.get('/registration', (req, res) => {
    res.render('Registration'); 
});

app.post('/registration', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Все поля должны быть заполнены.');
    }

    db.get(`SELECT * FROM users WHERE username = ? OR email = ?`, [username, email], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            return res.status(400).send('Имя пользователя или email уже используются.');
        }

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return console.error(err.message);
            }

            db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, hash], function(err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Пользователь ${username} добавлен с ID ${this.lastID}`);
                res.redirect('/login');
            });
        });
    });
});

app.get('/login', (req, res) => {
    res.render('Login'); 
});

app.post('/login', (req, res) => {
    const { login, password } = req.body;

    if (login === 'admin' && password === 'admin_password') {
        req.session.user = { username: 'admin', role: 'admin' }; 
        return res.redirect('/admin'); 
    }

    db.get('SELECT * FROM users WHERE username = ?', [login], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        if (!row) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
        }

        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Ошибка сервера' });
            }
            if (result) {
                req.session.user = { id: row.id, username: row.username, role: row.role };
                return res.json({ success: true });
            } else {
                return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
            }
        });
    });
});

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).send('Доступ запрещен');
}

app.get('/admin', isAdmin, (req, res) => {
    res.render('admin');
});

app.get('/index', (req, res) => {
    res.render('index');
});

app.get('/api/requests', (req, res) => {
    db.all('SELECT * FROM requests', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        res.json(rows);
    });
});
app.post('/api/requests', (req, res) => {
    const { fullName, address, date, time, services, pay } = req.body;
    db.run('INSERT INTO requests (fullName, address, date, time, services, pay) VALUES (?, ?, ?, ?, ?, ?)', 
        [fullName, address, date, time, services, pay], 
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Ошибка добавления заявки' });
            }
            res.status(201).json({ success: true, id: this.lastID });
        });
});
app.get('/admin', (req, res) => {
    db.all('SELECT * FROM requests', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        res.render('admin', { requests: rows });
    });
});

app.post('/api/requests/:id/accept', (req, res) => {
    const id = req.params.id;
    db.run('UPDATE requests SET status = ? WHERE id = ?', ['Принята', id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка обновления заявки' });
        }
        res.redirect('/admin');
    });
});

app.post('/api/requests/:id/reject', (req, res) => {
    const id = req.params.id;
    db.run('UPDATE requests SET status = ? WHERE id = ?', ['Отклонена', id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка обновления заявки' });
        }
        res.redirect('/admin');
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

