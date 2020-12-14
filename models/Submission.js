const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmissionSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    problemname: {
        type: String
    },
    problemcode: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    verdict:{
        type: String
    },
    verdicts: [{
        verdict: {
            type: String
        },
        time: {
            type: Number
        }
    }],
    time: {
        type: Number
    },
    section: {
        type: String,
        required: true
    },
    stdin: {
        type: String
    },
    lang: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});
mongoose.model('submissions', SubmissionSchema);