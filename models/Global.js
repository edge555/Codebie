const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GlobalSchema = new Schema({
    instructions: [{
        serial: {
            type: Number
        },
        title: {
            type: String
        },
        body: {
            type: String
        }
    }],
    faq: [{
        serial: {
            type: Number
        },
        qus: {
            type: String
        },
        ans: {
            type: String
        }
    }],
    update: [{
        title: {
            type: String
        },
        body: {
            type: String
        },
        dateAdded: {
            type: Date,
            default: Date.now
        }
    }]
});
mongoose.model('globals', GlobalSchema);