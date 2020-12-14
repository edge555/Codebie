if (process.env.NODE_ENV === 'production') {
    module.exports = {
        mongoURI: process.env.MONGO_URI_MAIN
    }
} else {
    module.exports = {
        mongoURI: 'mongodb://localhost/codebie'
    }
}