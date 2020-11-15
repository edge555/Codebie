if (process.env.NODE_ENV === 'production') {
    module.exports = {
        mongoURI: 'mongodb+srv://edge555:c0debie@codebie.7xicy.mongodb.net/codebie?retryWrites=true&w=majority'
    }
} else {
    module.exports = {
        mongoURI: 'mongodb://localhost/codebie'
    }
}