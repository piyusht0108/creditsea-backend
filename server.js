const express = require('express');
const {open} = require('sqlite')
const path = require('path')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()

const app = express()
app.use(cors())
app.use(express.json())
let database

const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database ' + err.message)
  } else {
    console.log('Connected to the SQLite database.')
  }
})

const initializeDbAndServer = async () => {
    try {
        database = await open({
            filename: path.join(__dirname, 'credit-app.db'),
            driver: sqlite3.Database
        });

        app.listen(5000, () => {
            console.log('Server is running on port 3000')
        });

    } catch (error) {
        console.error('Error initializing database and server:', error)
    }
};

app.get('/login', async (req, res) => {
    const { username, password } = req.query
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`
    const user = await database.get(query, [username, password])
    if (user) {
        res.status(200).json({ message: 'Login successful' })
    } else {
        res.status(401).json({ message: 'Invalid credentials' })
    }
});

app.post('/register', async (req, res) => {
    const {name, email, password, phone, address} = req.query
    const query = `INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)`
    await database.run(query, [name, email, password, phone, address])
    res.status(200).json({ message: 'Registration successful' })
})

app.get('/getUserDetails', async (req, res) => {
    const { username } = req.query
    const query = `SELECT * FROM users WHERE username = ?`
    const user = await database.get(query, [username])
    if (user) {
        res.status(200).json(user)
    } else {
        res.status(404).json({ message: 'User not found' })
    }
})

app.get('/getloans', async (req, res) => {
    const query = `SELECT * FROM loans`
    const loans = await database.all(query)
    if (loans) {
        res.status(200).json(loans)
    } else {
        res.status(404).json({ message: 'Loans not found' })
    }
})

app.get('/getUserLoans', async (req, res) => {
    const { user_id } = req.query
    const query = `SELECT * FROM loans WHERE user_id = ?`
    const loans = await database.all(query, [user_id])
    if (loans) {
        res.status(200).json(loans)
    } else {
        res.status(404).json({ message: 'Loans not found' })
    }
});

app.post('/submitloan', async (req, res) => {
    const {userId,
    fullName,
    loanAmount,
    loanTenure,
    reason,
    employmentStatus,
    employmentAddress1,
    employmentAddress2,
    termsAccepted} = req.body
    const query = `INSERT INTO loans (user_id, full_name, loan_amount, loan_tenure, reason, emp_status, emp_add, emp_add) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    await database.run(query, [userId, fullName, loanAmount, loanTenure, reason, employmentStatus, employmentAddress1, employmentAddress2])
});

app.get('/monthlyloans', async (req, res) => {
    const query = `SELECT strftime('%m', created_at) AS month, COUNT(*) AS loan_count FROM loans GROUP BY month`
    const monthlyLoans = await database.all(query)
    if (monthlyLoans) {
        res.status(200).json(monthlyLoans)
    } else {
        res.status(404).json({ message: 'Monthly loans not found' })
    }
})

app.get('/activeloans', async (req, res) => {
    const query = `SELECT strftime('%m', created_at) AS month, COUNT(*) AS loan_count FROM loans where loan_status="active" GROUP BY month`
    const monthlyLoans = await database.all(query)
    if (monthlyLoans) {
        res.status(200).json(monthlyLoans)
    } else {
        res.status(404).json({ message: 'Monthly loans not found' })
    }
})

initializeDbAndServer();

module.exports = app