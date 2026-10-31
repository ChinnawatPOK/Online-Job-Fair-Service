const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_REGEX = /^[0-9+\-\s]{9,20}$/;

// @route   POST /api/v1/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, tel, email, password } = req.body;

        if (!name || !tel || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, tel, email and password' });
        }
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ success: false, message: 'Please add a valid email' });
        }
        if (!TEL_REGEX.test(tel)) {
            return res.status(400).json({ success: false, message: 'Please add a valid telephone number' });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // role is never taken from the body: everyone registers as a normal user
        const user = await User.create({ name, tel, email, password });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'This email is already registered' });
        }
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot register user' });
    }
};

// @route   POST /api/v1/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        const user = await User.findByEmail(email, { withPassword: true });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await User.matchPassword(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        delete user.password;
        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot login' });
    }
};

// @route   GET /api/v1/auth/logout
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ success: true, data: {} });
};

// Create token, set cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = User.getSignedJwtToken(user.id);

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        id: user.id,
        name: user.name,
        tel: user.tel,
        email: user.email,
        role: user.role,
        token
    });
};
