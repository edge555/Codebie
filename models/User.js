const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        default: 'name'
    },
    csolvecount: {
        type: Number,
        default: 0
    },
    cppsolvecount: {
        type: Number,
        default: 0
    },
    javasolvecount: {
        type: Number,
        default: 0
    },
    pysolvecount: {
        type: Number,
        default: 0
    },
    dssolvecount: {
        type: Number,
        default: 0
    },
    algosolvecount: {
        type: Number,
        default: 0
    },
    totalsolvecount: {
        type: Number,
        default: 0
    },
    solved: [{
        code: {
            type: String,
            required: true
        },
        section: {
            type: String,
            required: true
        }
    }],
    dateJoined: {
        type: Date
    }
});
mongoose.model('users', UserSchema);