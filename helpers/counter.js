const mongoose = require('mongoose');
require('../models/Problem');  // Import the Problem model schema
const Problem = mongoose.model('problems');

// Get counter for problem sections
const getCounter = async (callback) => {
    try {
        const counter = {
            c: 0,
            cpp: 0,
            java: 0,
            py: 0,
            ds: 0,
            algo: 0
        };

        const problems = await Problem.find({});
        
        problems.forEach(problem => {
            if (counter.hasOwnProperty(problem.section)) {
                counter[problem.section]++;
            }
        });

        callback(counter);
    } catch (error) {
        console.error('Error getting counter:', error);
        callback({
            c: 0,
            cpp: 0,
            java: 0,
            py: 0,
            ds: 0,
            algo: 0
        });
    }
};

module.exports = getCounter; 