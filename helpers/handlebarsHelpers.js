const Handlebars = require('handlebars');

const helpers = {
    // Function to do basic mathematical operation in handlebar
    math: function (lvalue, operator, rvalue) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);
        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue,
            "x": (lvalue * 100) / rvalue
        }[operator];
    },
    // To format JS Date
    prettifyDate: function (timestamp, check) {
        function addZero(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }
        temp = "AM";
        var curr_date = timestamp.getDate();
        var curr_month = timestamp.getMonth();
        curr_month++;
        var curr_year = timestamp.getFullYear() % 100;
        var curr_hour = timestamp.getHours();
        if (curr_hour > 12) {
            curr_hour -= 12;
            temp = "PM";
        } else if (curr_hour == 0) {
            curr_hour = 12;
        }
        var curr_minutes = timestamp.getMinutes();
        if (check == 1) {
            result = addZero(curr_hour) + ':' + addZero(curr_minutes) + ' ' + temp + ' ' +
                addZero(curr_date) + "/" + addZero(curr_month) + "/" + addZero(curr_year);
        } else {
            result = addZero(curr_date) + "/" + addZero(curr_month) + "/" + addZero(curr_year);
        }
        return result;
    },
    // Comparing object
    ifCond: function (v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },
    fullLang: function (lang) {
        switch (lang) {
            case 'c':
                return "C";
            case 'cpp':
                return "C++";
            case 'java':
                return "Java";
            case 'py':
                return "Python";
            case 'ds':
                return "Data Structure"
            case 'algo':
                return "Algorithm";
            case 'AC':
                return "Accepted";
            case 'WA':
                return "Wrong Answer";
            case 'TL':
                return "Time Limit";
            case 'RE':
                return "Runtime Error";
            case 'CE':
                return "Compilation Error";
            default:
                return lang;
        }
    },
    breaklines: function (text) {
        text = Handlebars.Utils.escapeExpression(text);
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
        return new Handlebars.SafeString(text);
    }
};

module.exports = helpers; 