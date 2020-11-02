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
    testcaseno: {
        type: Number,
        default: 2
    },
    inputs: [{
        type: String,
        required: true
    }],
    outputs: [{
        type: String,
        required: true
    }],
    section: {
        type: String
    },
    solvecount: {
        type: Number,
        default: 0
    },
    tags: {
        type: String
    },
    editorial: {
        statement: {
            type: String
        },
        authorCode: {
            type: String
        }
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});
mongoose.model('problems', ProblemSchema);