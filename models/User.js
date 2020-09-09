const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true
    },
    password : {
        type: String,
        required: true,
        default: 'password'
    },
    name : {
        type: String,
        required: true,
        default: 'name'
    },
    csolvecount:{
        type: Number,
        default: 0
    },
    cppsolvecount:{
        type: Number,
        default: 0
    },
    javasolvecount:{
        type: Number,
        default: 0
    },
    pysolvecount:{
        type: Number,
        default: 0
    },
    dssolvecount:{
        type: Number,
        default: 0
    },
    algosolvecount:{
        type: Number,
        default: 0
    },
    totalsolvecount:{
        type: Number,
        default: 0
    },
    csolved:[{
        problemcode :{
            type: String,
            required: true
        },
        token :{
            type: String,
            required: true
        },
        verdict :{
            type: String,
            required: true
        },
        date:{
            type: Date,
            default: Date.now
        }
    }],
    cppsolved:[{
        problemcode :{
            type: String,
            required: true
        },
        token :{
            type: String,
            required: true
        },
        verdict :{
            type: String,
            required: true
        },
        date:{
            type: Date,
            default:Date.now
        }
    }],
    javasolved:[{
        problemcode :{
            type: String,
            required: true
        },
        token :{
            type: String,
            required: true
        },
        verdict :{
            type: String,
            required: true
        },
        date:{
            type: Date,
            default:Date.now
        }
    }],
    pysolved:[{
        problemcode :{
            type: String,
            required: true
        },
        token :{
            type: String,
            required: true
        },
        verdict :{
            type: String,
            required: true
        },
        date:{
            type: Date,
            default:Date.now
        }
    }],
    dssolved:[{
        problemcode :{
            type: String,
            required: true
        },
        token :{
            type: String,
            required: true
        },
        verdict :{
            type: String,
            required: true
        },
        date:{
            type: Date,
            default:Date.now
        }
    }],
    algosolved:[{
        problemcode :{
            type: String,
            required: true
        },
        token :{
            type: String,
            required: true
        },
        verdict :{
            type: String,
            required: true
        },
        date:{
            type: Date,
            default:Date.now
        }
    }]
});
mongoose.model('users',UserSchema);