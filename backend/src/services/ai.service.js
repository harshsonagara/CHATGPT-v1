const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

async function generateResponce(content) {
    const responce = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: content,
    });
    return responce.text;
}

async function generateVector(content) {
    const responce = await ai.models.embedContent({
        model:"gemini-embedding-001",
        contents:content,
        config:{
            outputDimensionality:768
        }
    });

    return responce.embeddings[0].values;
}

module.exports = {
    generateResponce,
    generateVector
}