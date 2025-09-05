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
        // console.log('User connectedd : ', socket.user);
        // console.log("New socket connection : ", socket.id);

        socket.on("ai-message", async (messagePayload) => {

            // console.log(messagePayload); /*  {  chat , content }*/

            const message = await messageModel.create({
                user: socket.user._id,
                chat: messagePayload.chat,
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
                metadata: {}
            })

            console.log('memory', memory);

            const chatHistory = (await messageModel.find({
                chat: messagePayload.chat,
            }).sort({ createdAt: -1 }).limit(20).lean()).reverse();

            const response = await aiService.generateResponce(chatHistory.map(item => {
                return {
                    role: item.role,
                    parts: [{ text: item.content }]
                }
            }));

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