const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

async function generateResponce(content) {
    const responce = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: content,
    });
    return responce.text;
}

module.exports = {
    generateResponce
}