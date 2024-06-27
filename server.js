const express = require('express');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');
const app = express();
const bcrypt = require('bcrypt');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jael',
    database: 'gpstollbasedsystem'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handle requests for index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission for registration
app.post('/register', upload.single('rcDocument'), async (req, res) => {
    const { username, password, gender, email, mobile } = req.body;
    const rcDocumentPath = req.file.path;

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (username, password, gender, email, mobile, rc_document_path) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [username, hashedPassword, gender, email, mobile, rcDocumentPath], (err, result) => {
        if (err) {
            console.error('Error saving data to the database:', err);
            return res.status(500).send('Error saving data to the database');
        }
        res.send('User registered successfully!');
    });
});

// Handle form submission for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send('Error querying the database');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const user = results[0];

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send('Invalid username or password');
        }

        res.send('Login successful!');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
