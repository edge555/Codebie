const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmissionSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    problemcode: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    verdict: {
        type: String,
        required: true
    },
    time: {
        type: Number,
        default: 0
    },
    memory: {
        type: Number,
        default: 0
    },
    section: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});
mongoose.model('submissions', SubmissionSchema);