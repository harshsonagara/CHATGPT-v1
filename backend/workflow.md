

# 🔄 Socket.IO + AI Chat Workflow

## 1. User Connection
- User tries to connect via **Socket.IO**.
- Middleware checks for **JWT token in cookies**.
  - ✅ If valid → fetch user from DB → allow connection.
  - ❌ If invalid → block connection.

---

## 2. User Sends Message
Event: `"ai-message"`  
Payload: `{ chat, content }`

Steps:
1. Save message → **MongoDB**
2. Generate vector → **aiService**
3. Store memory → **Vector DB**

---

## 3. Retrieve Memory & Chat History
1. Query vector DB → get top 3 similar memories.
2. Fetch last 20 messages of the same chat → **MongoDB**

---

## 4. AI Response Generation
1. Pass chat history into **aiService.generateResponce**.
2. Receive **AI-generated response**.

---

## 5. Store AI Response
1. Save response → **MongoDB**
2. Generate vector for response → **aiService**
3. Store response vector → **Vector DB**

---

## 6. Send Response Back
- Emit event: `"ai-responce"`  
- Payload: `{ content: response, chat }`  
- Delivered to the user in **real-time**.

---

## 📊 Visual Workflow (Text Diagram)

[User] 
   │
   ├─> Connect via Socket.IO
   │       │
   │       └─> [Auth Middleware] → Verify JWT → Load User
   │
   └─> Send "ai-message" { chat, content }
           │
           ├─> Save message → MongoDB
           ├─> Generate vector → aiService
           ├─> Store memory → Vector DB
           │
           ├─> Query similar memories → Vector DB
           ├─> Fetch last 20 chat messages → MongoDB
           │
           ├─> Generate AI response → aiService
           │
           ├─> Save AI response → MongoDB
           ├─> Generate vector for response
           ├─> Store response vector → Vector DB
           │
           └─> Emit "ai-responce" → back to User
