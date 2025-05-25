const Tutorial = require('../models/Tutorial');

class TutorialRepository {
    async findByCode(code) {
        return await Tutorial.findOne({ code }).lean();
    }

    async findBySection(section) {
        return await Tutorial.find({ section }).lean();
    }

    async create(tutorialData) {
        const tutorial = new Tutorial(tutorialData);
        return await tutorial.save();
    }

    async update(code, tutorialData) {
        return await Tutorial.findOneAndUpdate(
            { code },
            tutorialData,
            { new: true }
        ).lean();
    }

    async delete(code) {
        return await Tutorial.findOneAndDelete({ code }).lean();
    }
}

module.exports = new TutorialRepository(); 