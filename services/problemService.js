const problemRepository = require('../repositories/problemRepository');
const judge0Api = require('../helpers/judge0Api');
const { AppError } = require('../middleware/errorHandler');

class ProblemService {
    async getProblemByCode(code) {
        const problem = await problemRepository.findByCode(code);
        if (!problem) {
            throw new AppError('Problem not found', 404);
        }
        return problem;
    }

    async getProblemsBySection(section) {
        return await problemRepository.findBySection(section);
    }

    async addProblem(problemData) {
        // Validate required fields
        const requiredFields = [
            'name', 'code', 'difficulty', 'statement',
            'inputformat', 'constraints', 'outputformat',
            'timelimit', 'testcasecount', 'samplecount',
            'inputs', 'outputs', 'section'
        ];

        for (const field of requiredFields) {
            if (!problemData[field]) {
                throw new AppError(`${field} is required`, 400);
            }
        }

        // Validate test cases
        if (problemData.inputs.length !== problemData.testcasecount ||
            problemData.outputs.length !== problemData.testcasecount) {
            throw new AppError('Number of test cases does not match testcasecount', 400);
        }

        // Validate sample cases
        if (problemData.samplecount > problemData.testcasecount) {
            throw new AppError('Sample count cannot be greater than test case count', 400);
        }

        // Check if problem with same code exists
        const existingProblem = await problemRepository.findByCode(problemData.code);
        if (existingProblem) {
            throw new AppError('Problem with this code already exists', 400);
        }

        return await problemRepository.create(problemData);
    }

    async updateProblem(code, problemData) {
        // Check if problem exists
        const existingProblem = await problemRepository.findByCode(code);
        if (!existingProblem) {
            throw new AppError('Problem not found', 404);
        }

        // Validate required fields
        const requiredFields = [
            'name', 'difficulty', 'statement',
            'inputformat', 'constraints', 'outputformat',
            'timelimit', 'testcasecount', 'samplecount',
            'inputs', 'outputs', 'section'
        ];

        for (const field of requiredFields) {
            if (!problemData[field]) {
                throw new AppError(`${field} is required`, 400);
            }
        }

        // Validate test cases
        if (problemData.inputs.length !== problemData.testcasecount ||
            problemData.outputs.length !== problemData.testcasecount) {
            throw new AppError('Number of test cases does not match testcasecount', 400);
        }

        // Validate sample cases
        if (problemData.samplecount > problemData.testcasecount) {
            throw new AppError('Sample count cannot be greater than test case count', 400);
        }

        return await problemRepository.update(code, problemData);
    }

    async deleteProblem(code) {
        const problem = await problemRepository.findByCode(code);
        if (!problem) {
            throw new AppError('Problem not found', 404);
        }
        return await problemRepository.delete(code);
    }

    async submitSolution(code, submission) {
        const problem = await this.getProblemByCode(code);
        
        // Validate submission
        if (!submission.code || !submission.language) {
            throw new AppError('Code and language are required', 400);
        }

        // Get test cases
        const testCases = problem.inputs.map((input, index) => ({
            input,
            output: problem.outputs[index]
        }));

        // Submit to judge
        const results = await Promise.all(
            testCases.map(testCase => 
                judge0Api.submit({
                    sourceCode: submission.code,
                    language: submission.language,
                    input: testCase.input,
                    expectedOutput: testCase.output,
                    timeLimit: problem.timelimit
                })
            )
        );

        return {
            problem,
            results,
            isAccepted: results.every(result => result.status === 'AC')
        };
    }

    async incrementSolveCount(code) {
        const problem = await problemRepository.findByCode(code);
        if (!problem) {
            throw new AppError('Problem not found', 404);
        }
        return await problemRepository.incrementSolveCount(code);
    }

    async getSolvedProblemsByUser(username) {
        return await problemRepository.findSolvedProblemsByUser(username);
    }
}

module.exports = new ProblemService(); 