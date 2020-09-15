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
        type: Number,
        default: 1
    },
    statement: {
        type: String
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
    },
    solvecount: {
        type: Number,
        default: 0
    }
});
mongoose.model('problems', ProblemSchema);