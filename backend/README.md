# CHATGPT backend — Quick README

This README explains the backend structure, request + socket flow, run steps, common pitfalls, and where the flow diagram lives.

## Overview

- server.js — creates HTTP server, connects to DB, and wires Socket.IO.
- src/app.js — Express app: global middleware (json, cookieParser) and routes.
- src/db/db.js — mongoose connection helper.
- src/sockets/socket.server.js — Socket.IO server with cookie-based JWT handshake and `ai-message` handler.
- src/middleware/auth.middleware.js — verifies JWT (cookie or Authorization header) and attaches `req.user`.
- src/routes/_ and src/controller/_ — HTTP routes and business logic.
- src/models/\* — Mongoose models (user, chat, message).
- src/services/ai.service.js — AI response generator called by sockets/controllers.

## Quick start (Windows PowerShell)

1. Install dependencies

```powershell
cd .\backend
npm install
```

2. Create a `.env` file in `backend/` with at least:

```dotenv
PORT=3000
MONGO_URI=mongodb://...your-uri...
JWT_SECRET=your_jwt_secret
```

3. Run server

```powershell
node .\server.js
```

Expected console messages: `connected to db` and `Server is running on port <PORT>`.

## API (HTTP)

- POST /api/auth/register

  - Body: { "email": "user@example.com", "password": "secret" }
  - Controller should hash password (await bcrypt.hash) and create user, then sign a JWT and set a cookie: `res.cookie('token', token, { httpOnly: true })`.

- POST /api/auth/login

  - Body: { "email": "...", "password": "..." }
  - Returns cookie/token on success.

- POST /api/chat (protected)
  - Requires cookie `token` or Authorization header `Bearer <token>`.
  - Uses `auth.middleware` to attach `req.user`.

## Socket.IO (realtime)

The socket server expects authentication via cookie `token` on the handshake. Typical clients:

- Browser (recommended, cookies sent automatically after login):

```js
// in browser client code
const socket = io("http://localhost:3000", { withCredentials: true });
// then emit
socket.emit("ai-message", { chat: "<chatId>", content: "hi" });
socket.on("ai-responce", (data) => console.log(data));
```

- Node (direct token header):

```js
const { io } = require("socket.io-client");
const socket = io("http://localhost:3000", {
  extraHeaders: {
    Cookie: `token=${token}`,
  },
});
```

Server-side handshake (in `src/sockets/socket.server.js`) parses cookies, verifies JWT, finds user, and attaches `socket.user`. The socket listens for `ai-message` and uses `ai.service` to generate responses, saving messages to the DB.

## Common issues & fixes

- "Cannot POST /api/auth/register": Ensure `src/app.js` contains `app.use('/api/auth', authRoutes);` and the server is running on the expected port.

- "ValidationError: Cast to string failed for value Promise { <pending> }" when saving password: You're saving a Promise (missing `await`). Fix by awaiting the bcrypt hash before creating the User:

```js
const hashed = await bcrypt.hash(password, 10);
await User.create({ email, password: hashed });
```

- Sockets always Unauthorized: Socket server reads cookie header. Make sure the client sends cookie `token` (browser will if `res.cookie('token', ...)` was set). For non-browser clients, send Cookie header as shown above.

- server.js must create a real HTTP server instance and pass it to Socket.IO. Example:

```js
const http = require("http");
const server = http.createServer(app);
initiSocketServer(server);
server.listen(process.env.PORT || 3000);
```

## Flow diagram

A simple Excalidraw diagram is stored at `backend/temp.excalidraw`. Open it with the Excalidraw VS Code extension or the Excalidraw web app to view the request & socket flows.

## Data shapes (examples)

- Register request: `{ email: string, password: string }`
- JWT payload: `{ id: '<userId>', iat, exp }`
- Socket emit `ai-message`: `{ chat: '<chatId>', content: 'text' }`
- Saved message document: `{ user: ObjectId, chat: ObjectId, content: string, role: 'user'|'model' }`

## Next steps / recommendations

- Add input validation (express-validator or Joi) to controllers.
- Add tests for auth and socket handshake.
- Add rate-limiting around AI calls.
- Optionally export `temp.excalidraw` to PNG and add to repo docs.

If you want, I can:

- Export the Excalidraw to PNG and add it to `backend/docs/flow.png`.
- Add a short `README.md` to the repo root referencing both backend and frontend.
- Open and fix `auth.controller.js` if you still see the password hashing issue.

Tell me which of those you'd like next.
