const unirest = require('unirest');
const logger = require('../helpers/logger');

class JudgeService {
    constructor() {
        this.baseUrl = "https://judge0-ce.p.rapidapi.com";
        this.headers = {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
            "content-type": "application/json",
            "accept": "application/json",
            "useQueryString": true
        };
    }

    async submitCode(code, language, input, output, timeLimit) {
        try {
            const langId = this.getLanguageId(language);
            const response = await this.makeRequest('POST', '/submissions', {
                language_id: langId,
                source_code: code,
                stdin: input,
                expected_output: output,
                cpu_time_limit: timeLimit
            });

            return response.token;
        } catch (error) {
            logger.error('Judge0 submission error:', error);
            throw new Error('Failed to submit code to Judge0');
        }
    }

    async getSubmissionResult(token) {
        try {
            const response = await this.makeRequest('GET', `/submissions/${token}`);
            return this.parseVerdict(response);
        } catch (error) {
            logger.error('Judge0 result error:', error);
            return {
                status: { id: 6, description: 'Runtime Error' },
                stdout: '',
                time: '0',
                memory: 0,
                stderr: null,
                compile_output: null,
                message: null
            };
        }
    }

    getLanguageId(language) {
        const languageMap = {
            'c': 50,      // C (GCC 9.2.0)
            'cpp': 52,    // C++ (GCC 7.4.0)
            'java': 62,   // Java (OpenJDK 8)
            'py': 71      // Python (3.8.1)
        };
        return languageMap[language] || 52; // Default to C++
    }

    parseVerdict(result) {
        if (result === "CE") {
            return {
                status: { id: 6, description: 'Runtime Error' },
                stdout: '',
                time: '0',
                memory: 0,
                stderr: null,
                compile_output: null,
                message: null
            };
        }

        const statusMap = {
            3: 'AC',  // Accepted
            4: 'WA',  // Wrong Answer
            5: 'TL',  // Time Limit Exceeded
            6: 'CE',  // Compilation Error
            7: 'RE',  // Runtime Error
            8: 'RE',  // Runtime Error
            9: 'RE',  // Runtime Error
            10: 'RE', // Runtime Error
            11: 'RE', // Runtime Error
            12: 'RE'  // Runtime Error
        };

        return {
            ...result,
            status: {
                ...result.status,
                description: statusMap[result.status.id] || 'Unknown Error'
            }
        };
    }

    makeRequest(method, endpoint, data = null) {
        return new Promise((resolve, reject) => {
            const req = unirest(method, `${this.baseUrl}${endpoint}`);
            req.headers(this.headers);

            if (data) {
                req.type('json');
                req.send(data);
            }

            req.end(response => {
                if (response.error) {
                    reject(response.error);
                } else {
                    resolve(response.body);
                }
            });
        });
    }
}

module.exports = new JudgeService(); 