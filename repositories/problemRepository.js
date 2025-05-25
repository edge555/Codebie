const Problem = require('../models/Problem');

class ProblemRepository {
    async findByCode(code) {
        return await Problem.findOne({ code }).lean();
    }

    async findBySection(section) {
        return await Problem.find({ section })
            .sort({ difficulty: 'asc' })
            .lean();
    }

    async create(problemData) {
        const problem = new Problem(problemData);
        return await problem.save();
    }

    async update(code, problemData) {
        return await Problem.findOneAndUpdate(
            { code },
            problemData,
            { new: true }
        ).lean();
    }

    async delete(code) {
        return await Problem.findOneAndDelete({ code }).lean();
    }

    async incrementSolveCount(code) {
        return await Problem.findOneAndUpdate(
            { code },
            { $inc: { solvecount: 1 } },
            { new: true }
        ).lean();
    }

    async findSolvedProblemsByUser(username) {
        return await Problem.find({
            'solvedBy': username
        }).lean();
    }
}

module.exports = new ProblemRepository(); 