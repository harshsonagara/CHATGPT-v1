const app = require('./src/app');
const connectDB = require('./src/db/db');
const { initiSocketServer } = require('./src/sockets/socket.server');
const httpServer = require('http').createServer(app);

connectDB();
initiSocketServer(httpServer);

httpServer.listen(process.env.PORT, () => {
    console.log(`Server is running on ${process.env.PORT}`);
});
