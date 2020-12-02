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
    inputformat:{
        type: String
    },
    constraints: {
        type: String
    },
    timelimit: {
        type: Number,
        default: 1
    },
    outputformat:{
        type: String
    },
    testcasecount: {
        type: Number,
        default: 2
    },
    samplecount: {
        type: Number,
        default: 1
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
    multipleParts :{
        type : Number,
        default : 0
    },
    editorial: {
        statement: {
            type: String
        },
        authorUsername: {
            type: String
        },
        authorSolution: {
            type: String
        }
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});
mongoose.model('problems', ProblemSchema);