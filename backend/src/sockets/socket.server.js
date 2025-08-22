const { Server } = require("socket.io");


function initiSocketServer(httperver) {
    const io = new Server(httperver, {});

    io.on("connection", (socket) => {
        console.log("New client connected");


        
    }); 

}

module.exports = { initiSocketServer };