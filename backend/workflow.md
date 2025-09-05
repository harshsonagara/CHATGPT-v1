# 🔄 Socket.IO + AI Chat Workflow

This section explains how the `initiSocketServer` works, from user authentication to AI response delivery.

---

## 📊 ASCII Workflow Diagram
                                                    ┌────────────────────────────────────┐
                                                    │          Client (User)             │
                                                    └────────────────────────────────────┘
                                                                    │
                                                                    ▼
                                                      ┌─────────────────────────┐
                                                      │  Connect via Socket.IO  │
                                                      └─────────────────────────┘
                                                                    │
                                                                    ▼
                                                      ┌─────────────────────────────┐
                                                      │  Middleware: Authentication │
                                                      └─────────────────────────────┘
                                                                    │
                                          ┌────────────────────────┼────────────────────────┐
                                          │                        │                        │
                                          ▼                        ▼                        ▼
                          ┌───────────────────────┐ ┌───────────────────────────┐ ┌──────────────────────┐
                          │ No Token Provided     │ │ JWT Invalid               │ │ JWT Valid            │
                          │ → Reject Connection   │ │ → Reject Connection       │ │ → Fetch User from DB │
                          └───────────────────────┘ └───────────────────────────┘ └──────────────────────┘
                                                                                      │
                                                                                      ▼
                                                                      ┌──────────────────────────────┐
                                                                      │   Connection Established     │
                                                                      │   socket.user = current user │
                                                                      └──────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                                      ┌─────────────────────────────────┐
                                                                      │   "ai-message" Event Received   │
                                                                      │   { chat, content }             │
                                                                      └─────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                          ┌───────────────────────────────────────────────────────┐
                                                          │ Save Message → MongoDB (messageModel)                 │
                                                          │ role = "user", chatId, userId, content                │
                                                          └───────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                          ┌───────────────────────────────────────────────────────┐
                                                          │ Generate Vector → aiService.generateVector(content)   │
                                                          └───────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                          ┌───────────────────────────────────────────────────────┐
                                                          │ Store Memory → createMemory()                         │
                                                          │ vectors, messageId, metadata (chat, user, text)       │
                                                          └───────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Query Memory → queryMemory()                                   │
                                                  │ Retrieve top 3 similar messages from vector DB                 │
                                                  └────────────────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Fetch Recent Chat History → MongoDB                            │
                                                  │ Get last 20 messages in this chat                              │
                                                  └────────────────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Combine Context:                                               │
                                                  │ • Long-Term Memory (from vector DB)                            │
                                                  │ • Short-Term Chat History (last 20 messages)                   │
                                                  └────────────────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Generate AI Response → aiService.generateResponse([...ltm, stm])│
                                                  └────────────────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Save AI Response → MongoDB                                     │
                                                  │ role = "model", content = response                             │
                                                  └────────────────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Generate Vector for Response → aiService.generateVector()      │
                                                  └────────────────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Store AI Response Memory → createMemory()                      │
                                                  └────────────────────────────────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                  ┌────────────────────────────────────────────────────────────────┐
                                                  │ Emit Event → "ai-response" back to Client                      │
                                                  │ { content: response, chat: chatId }                            │
                                                  └────────────────────────────────────────────────────────────────┘


## 🎨 Mermaid Flowchart (GitHub/VS Code)

```mermaid
flowchart TD
    A[Client (User)] --> B[Connect via Socket.IO]
    B --> C[Middleware: Authentication]

    C -->|No Token| D[Reject Connection]
    C -->|Invalid JWT| E[Reject Connection]
    C -->|Valid JWT| F[Fetch User from DB]

    F --> G[Connection Established<br/>socket.user = current user]
    G --> H["ai-message" Event { chat, content }]

    H --> I[Save Message → MongoDB<br/>(role: user, chatId, userId, content)]
    I --> J[Generate Vector → aiService.generateVector(content)]
    J --> K[Store Memory → createMemory()<br/>(vectors, messageId, metadata)]
    K --> L[Query Memory → queryMemory()<br/>Retrieve top 3 similar messages]
    L --> M[Fetch Recent Chat History → MongoDB<br/>Last 20 messages]
    M --> N[Combine Context:<br/>• Long-Term Memory<br/>• Short-Term History]
    N --> O[Generate AI Response → aiService.generateResponce([...ltm, stm])]
    O --> P[Save AI Response → MongoDB<br/>(role: model, content: response)]
    P --> Q[Generate Vector for Response → aiService.generateVector()]
    Q --> R[Store AI Response Memory → createMemory()]
    R --> S[Emit Event → "ai-responce"<br/>{ content, chat }]
