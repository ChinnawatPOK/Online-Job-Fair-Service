const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Load env vars
dotenv.config({ path: './config/config.env' });

const { initTables } = require('./config/pgdb');

// Route files
const auth = require('./routes/auth');
const companies = require('./routes/companies');
const bookings = require('./routes/bookings');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/companies', companies);
app.use('/api/v1/bookings', bookings);

const PORT = process.env.PORT || 5000;

const start = async () => {
    await initTables();

    const server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    process.on('unhandledRejection', (err) => {
        console.log(`Error: ${err.message}`);
        server.close(() => process.exit(1));
    });
};

start().catch((err) => {
    console.error(`Cannot start server: ${err.message}`);
    process.exit(1);
});
