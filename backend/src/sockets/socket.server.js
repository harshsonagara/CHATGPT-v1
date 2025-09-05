const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const aiService = require('../services/ai.service');
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require('../services/vector.service');


function initiSocketServer(httperver) {
    const io = new Server(httperver, {});

    //** only loggged in user can connect */
    io.use(async (socket, next) => {

        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        if (!cookies.token) {
            next(new Error(" Authentication error : No token provided"));
        }

        try {

            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

            const user = await userModel.findById(decoded.id);

            socket.user = user;

            next();

        } catch (error) {
            next(new Error("Authentication error: invalid token"));
        }

    });

    io.on("connection", (socket) => {

        socket.on("ai-message", async (messagePayload) => {

            const message = await messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: messagePayload.content,
                role: "user"
            });

            const vectors = await aiService.generateVector(messagePayload.content);

            await createMemory({
                vectors,
                messageId: message._id,
                metadata: {
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    text: messagePayload.content
                }
            });


            const memory = await queryMemory({
                queryVector: vectors,
                limit: 3,
                metadata: {
                    user: socket.user._id,
                }
            });

            console.log('memory', memory);

            const chatHistory = (await messageModel.find({
                chat: messagePayload.chat,
            }).sort({ createdAt: -1 }).limit(20).lean()).reverse();

            const stm = chatHistory.map(item => {
                return {
                    role: item.role,
                    parts: [{ text: item.content }]
                }
            });

            const ltm = [
                {
                    role: "user",
                    parts: [{
                        text: `
                        these are some previous message from the chat , use them to genearte a responce
                        ${memory.map(item => item.metadata.text).join("\n")}
                        
                        `
                    }]
                }
            ]

            console.log(ltm[0]);
            console.log(stm[0]);

            const response = await aiService.generateResponce([...ltm, ...stm]);

            const responceMessage = await messageModel.create({
                user: socket.user._id,
                chat: messagePayload.chat,
                content: response,
                role: "model"
            });

            const responceVectors = await aiService.generateVector(messagePayload.content);

            await createMemory({
                vectors: responceVectors,
                messageId: responceMessage._id,
                metadata: {
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    text: response
                }
            });


            socket.emit('ai-responce', {
                content: response,
                chat: messagePayload.chat
            });


        });
    });

}

module.exports = { initiSocketServer };