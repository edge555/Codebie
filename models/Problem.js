const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProblemSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        default: 'easy'
    },
    statement: {
        type: String,
        default: 'statement',
        required: true
    },
    constraints: {
        type: String
    },
    timelimit: {
        type: Number,
        default: 1
    },
    memorylimit: {
        type: Number,
        default: 100000
    },
    sampleinput: {
        type: String,
        required: true
    },
    sampleoutput: {
        type: String,
        required: true
    },
    hiddeninput: {
        type: String
    },
    hiddenoutput: {
        type: String
    },
    tags: {
        type: String
    }
});
mongoose.model('problems', ProblemSchema);