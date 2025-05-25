const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Token = require('../models/Token');
const { getBDTime } = require('../helpers/utils');

// Register new user
exports.register = async (req, res) => {
    try {
        const { username, email, password, password2 } = req.body;
        const errors = [];

        // Check required fields
        if (!username || !email || !password || !password2) {
            errors.push({ text: 'Please fill in all fields' });
        }

        // Check passwords match
        if (password !== password2) {
            errors.push({ text: 'Passwords do not match' });
        }

        // Check password length
        if (password.length < 6) {
            errors.push({ text: 'Password must be at least 6 characters' });
        }

        if (errors.length > 0) {
            return res.render('enter', {
                errors,
                username,
                email
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email: email });
        if (userExists) {
            errors.push({ text: 'Email already registered' });
            return res.render('enter', {
                errors,
                username,
                email
            });
        }

        // Create new user
        const newUser = new User({
            username,
            email,
            password,
            dateJoined: getBDTime()
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);

        // Save user
        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/enter');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error_msg', 'An error occurred during registration');
        res.redirect('/enter');
    }
};

// Get troubleshoot page
exports.getTroubleshoot = (req, res) => {
    res.render('troubleshoot', {
        curuser: req.user,
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')
    });
};

// Handle troubleshoot form
exports.handleTroubleshoot = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.flash('error_msg', 'No account found with that email');
            return res.redirect('/troubleshoot');
        }

        // Generate reset token
        const token = new Token({
            email: user.email,
            purpose: 'resetpass',
            createdAt: new Date()
        });

        await token.save();

        // TODO: Send reset email with token
        req.flash('success_msg', 'Password reset instructions have been sent to your email');
        res.redirect('/enter');
    } catch (error) {
        console.error('Troubleshoot error:', error);
        req.flash('error_msg', 'An error occurred while processing your request');
        res.redirect('/troubleshoot');
    }
};

// Get reset password page
exports.getResetPassword = (req, res) => {
    if (req.user) {
        return res.redirect('/home');
    }
    res.render('resetpass', {
        id: req.params.id,
        errors: [],
        error_msg: req.flash('error_msg')
    });
};

// Handle reset password
exports.handleResetPassword = async (req, res) => {
    try {
        const errors = [];
        const { usernewpassword, usernewpassword2 } = req.body;

        // Validate passwords
        if (!usernewpassword || !usernewpassword2) {
            errors.push({ text: "All fields are required" });
        } else if (usernewpassword !== usernewpassword2) {
            errors.push({ text: "Passwords do not match" });
        } else if (usernewpassword.length < 6) {
            errors.push({ text: "Password must be at least 6 characters long" });
        }

        if (errors.length > 0) {
            return res.render('resetpass', {
                id: req.params.id,
                errors: errors
            });
        }

        // Find token and user
        const token = await Token.findOne({ token: req.params.id });
        if (!token) {
            req.flash('error_msg', 'Invalid or expired reset token');
            return res.redirect('/enter');
        }

        const user = await User.findOne({ email: token.email });
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/enter');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(usernewpassword, salt);

        // Update user password
        user.password = hash;
        await user.save();

        // Delete used token
        await Token.deleteOne({ token: req.params.id });

        req.flash('success_msg', 'Password has been reset successfully. You can now log in with your new password.');
        res.redirect('/enter');
    } catch (error) {
        console.error('Password reset error:', error);
        req.flash('error_msg', 'An error occurred while resetting your password');
        res.redirect('/enter');
    }
}; 