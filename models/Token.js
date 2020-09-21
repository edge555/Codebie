const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    createDate: {
        type: Date,
        default: Date.now
    }

});
mongoose.model('tokens', TokenSchema);