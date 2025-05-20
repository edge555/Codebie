const unirest = require('unirest');

// Judge0 API call to get execution info
function getoutput(submissiontoken, callback) {
    console.log(submissiontoken);
    var req = unirest("GET", "https://judge0-ce.p.rapidapi.com/submissions/" + submissiontoken);
    req.headers({
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
        "useQueryString": true
    });
    req.end(function (res) {
        if (res.error) {
            var verdict = "CE";
            callback(verdict);
        } else {
            callback(res.body);
        }
    });
}

// Judge0 API call for submitting code
function gettoken(req, submission, input, output, timelimit, callback) {
    // Judge0 API for submitting code
    var req = unirest("POST", "https://judge0-ce.p.rapidapi.com/submissions");
    req.headers({
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
        "content-type": "application/json",
        "accept": "application/json",
        "useQueryString": true
    });
    /* 
    Language ids:
    C (GCC 9.2.0) : 50,
    C++ (GCC 7.4.0) : 52,
    Java (OpenJDK 8) : 62,
    Python (3.8.1) : 71
    */
    var lang_id;
    if (submission.language == "c") {
        lang_id = 50;
    } else if (submission.language == "cpp") {
        lang_id = 52;
    } else if (submission.language == "java") {
        lang_id = 62;
    } else if (submission.language == "py") {
        lang_id = 71;
    }

    req.type("json");
    req.send({
        "source_code": submission.code,
        "language_id": lang_id,
        "stdin": input,
        "expected_output": output,
        "cpu_time_limit": timelimit
    });

    req.end(function (res) {
        if (res.error) {
            console.log(res.error);
            var verdict = "CE";
            callback(verdict);
        } else {
            callback(res.body);
        }
    });
}

module.exports = {
    getoutput,
    gettoken
}; 