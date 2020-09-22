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
    }
});
mongoose.model('tokens', TokenSchema);