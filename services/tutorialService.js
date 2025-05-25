const tutorialRepository = require('../repositories/tutorialRepository');

class TutorialService {
    async getTutorialByCode(code) {
        const tutorial = await tutorialRepository.findByCode(code);
        if (!tutorial) {
            throw new Error('Tutorial not found');
        }
        return tutorial;
    }

    async getTutorialsBySection(section) {
        return await tutorialRepository.findBySection(section);
    }

    async addTutorial(tutorialData) {
        // Validate required fields
        const requiredFields = ['name', 'code', 'statement', 'section'];
        for (const field of requiredFields) {
            if (!tutorialData[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // Check if tutorial with same code exists
        const existingTutorial = await tutorialRepository.findByCode(tutorialData.code);
        if (existingTutorial) {
            throw new Error('Tutorial with this code already exists');
        }

        return await tutorialRepository.create(tutorialData);
    }

    async updateTutorial(code, tutorialData) {
        // Check if tutorial exists
        const existingTutorial = await tutorialRepository.findByCode(code);
        if (!existingTutorial) {
            throw new Error('Tutorial not found');
        }

        // Validate required fields
        const requiredFields = ['name', 'statement', 'section'];
        for (const field of requiredFields) {
            if (!tutorialData[field]) {
                throw new Error(`${field} is required`);
            }
        }

        return await tutorialRepository.update(code, tutorialData);
    }

    async deleteTutorial(code) {
        const tutorial = await tutorialRepository.findByCode(code);
        if (!tutorial) {
            throw new Error('Tutorial not found');
        }
        return await tutorialRepository.delete(code);
    }
}

module.exports = new TutorialService(); 