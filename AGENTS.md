# Ward Project - Agent Guidelines

This document provides instructions and guidelines for AI agents working on the Ward codebase.

## 1. Project Overview
Ward is a TypeScript-based application integrating WhatsApp (via Baileys) and NATS for message delivery and handling.

- **Runtime:** Node.js
- **Language:** TypeScript (Strict mode enabled)
- **Module System:** CommonJS (Output), ES Modules (Syntax)

## 2. Build & execution
### Commands
- **Build:** `npm run build` (Compiles TypeScript to `dist/`)
- **Start:** `npm start` (Runs the compiled `dist/main.js`)
- **Test:** *No test framework is currently configured.* 
  - If asked to add tests, prefer **Jest** or **Vitest**.
  - Create test files alongside source files (e.g., `src/foo.test.ts`).

### Environment
- Environment variables are managed via `dotenv`.
- **IMPORTANT:** All environment variables must be defined and exported in `src/config.ts` with a fallback/default value.
- Do not access `process.env` directly in feature code; import from `src/config.ts` instead.

## 3. Code Style & Conventions

### Formatting
- **Indentation:** 2 spaces
- **Quotes:** Single quotes (`'`)
- **Semicolons:** Avoid semicolons (ASI).
- **Trailing Commas:** None (based on existing code).
- **Brackets:** K&R style (open brace on same line).

### Naming
- **Variables/Functions:** `camelCase` (e.g., `handlePing`, `sockReady`)
- **Constants/Env Vars:** `UPPER_CASE` (e.g., `SESSION`, `NATS_SERVERS`)
- **Files:** `kebab-case` or `camelCase` (match adjacent files).
- **Classes/Interfaces:** `PascalCase`.

### Imports
- Use **relative imports** (e.g., `../socket.service`, `./config`).
- Do not use path aliases (like `@/`) as they are not configured in `tsconfig.json`.

### TypeScript
- `strict: true` is enabled.
- Avoid `any` where possible, though it is used in some legacy parts (e.g., `sock: any`).
- Define interfaces for message payloads and complex objects.

## 4. Architecture & Patterns

### Directory Structure
- `src/main.ts`: Entry point. Starts services.
- `src/config.ts`: Centralized configuration.
- `src/commands/`: Individual command handlers.
- `src/*.service.ts`: Core logic (Socket, Delivery).

### Adding Features
1. **New Commands:**
   - Create a new file in `src/commands/`.
   - Export a handler function (e.g., `export async function handleNewCommand(...)`).
   - Register/call it where appropriate (likely in `src/message.ts` or similar router).

2. **NATS Consumers:**
   - Logic for consuming NATS messages resides in `src/delivery.service.ts`.
   - Ensure you handle `nak()` and `ack()` correctly to prevent message loss.
   - Respect `MIN_BACKOFF_DELAY_MS` / `MAX_BACKOFF_DELAY_MS`.

3. **WhatsApp/Baileys:**
   - Socket logic is in `src/socket.service.ts`.
   - Use the global `sock` object to send messages.
   - Check `sockReady[SESSION]` before attempting to send.

### Error Handling
- Use `try/catch` blocks for async operations.
- Log errors using `console.error` (or `pino` if context requires).
- Ensure promises are handled (no floating promises).

## 5. Deployment/Production
- The app runs from the `dist/` directory.
- Ensure `npm run build` passes before considering a task complete.

## 6. Environment Variables Reference
Ensure these are set in your `.env` file or environment. Defaults are provided in `src/config.ts`.

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION` | `main` | Identifier for the WhatsApp session |
| `LOG_DIR` | `/tmp` | Directory for storing logs/message dumps |
| `SESSION_DIR` | `/tmp` | Directory for storing Baileys auth credentials |
| `NATS_SERVERS` | `nats://localhost:4222` | NATS server connection string |
| `NATS_TOKEN` | - | Auth token for NATS |
| `NATS_STREAM` | `JOBS` | JetStream stream name |
| `NATS_CONSUMER` | `wa_delivery` | JetStream consumer name |
| `MIN/MAX_BACKOFF_DELAY_MS` | `1000`/`32000` | Retry backoff strategies |
| `NATS_PULL_DELAY_MS` | `16000` | Delay between message pulls |

## 7. Architecture Deep Dive
The application acts as a bridge between a NATS JetStream and the WhatsApp network.

### Message Flow (Outbound)
1. **Ingestion:** External services publish messages to the NATS stream (`JOBS`).
2. **Consumption:** `src/delivery.service.ts` pulls messages from the `wa_delivery` consumer.
3. **Processing:**
   - The message headers (`to`, `type`, options) are parsed.
   - The body is decoded.
   - The global `sock` object (from `src/socket.service.ts`) is used to dispatch the message.
4. **Ack/Nak:**
   - If successful, the NATS message is acknowledged (`msg.ack()`).
   - If `sockReady` is false, the message is negatively acknowledged (`msg.nak()`) to be retried later.

### Message Flow (Inbound)
1. **Baileys Event:** `sock.ev.on('messages.upsert', ...)` receives new messages in `src/socket.service.ts`.
2. **Filtering:** Messages from self (`key.fromMe`) or without content are ignored.
3. **Routing:** `handleMessage` (in `src/message.ts`) routes the text content to specific command handlers in `src/commands/`.

## 8. Code Examples & Best Practices

### ✅ Good: Checking Socket State
Always verify the socket is connected before attempting operations.
```typescript
import { sock, sockReady } from './socket.service'
import { SESSION } from './config'

export async function sendMessage(jid: string, text: string) {
  if (!sockReady[SESSION]) {
    console.warn('Socket not ready, skipping message')
    return
  }
  await sock[SESSION].sendMessage(jid, { text })
}
```

### ❌ Bad: Ignoring Async/Promises
Floating promises can lead to unhandled rejections and crashes.
```typescript
// DON'T DO THIS
sock[SESSION].sendMessage(jid, { text: 'hello' }) 

// DO THIS
await sock[SESSION].sendMessage(jid, { text: 'hello' })
  .catch(err => console.error('Failed to send:', err))
```

### ✅ Good: Adding a New Command
Create `src/commands/my-feature.ts`:
```typescript
import { sock, sockReady } from '../socket.service'
import { SESSION } from '../config'

export async function handleMyFeature(jid: string) {
  if (!sockReady[SESSION]) return
  await sock[SESSION].sendMessage(jid, { text: 'Feature executed' })
}
```

## 9. Common Pitfalls & Troubleshooting
- **`sock` object not ready:** Always check `sockReady[SESSION]` before sending messages. If false, the socket is disconnected or connecting.
- **NATS Connection:** Ensure NATS server is running. The app will exit if it cannot connect on startup.
- **Environment Variables:** Missing variables will fall back to defaults in `config.ts`, but this might not work for production credentials. Always verify `.env`.
- **Duplicate Consumers:** Be careful when running multiple instances locally; they might compete for NATS messages if using the same consumer name.
- **"oldString not found" errors:** When using AI tools to edit code, ensure you are quoting exact lines. The codebase uses 2 spaces for indentation.

## 10. Future Testing Strategy
Since there are no tests currently, if you are asked to add them:
1. **Install Jest:** `npm install --save-dev jest ts-jest @types/jest`
2. **Mocking:** You MUST mock `baileys` and `nats`. Do not attempt real connections in tests.
   ```typescript
   jest.mock('baileys', () => ({
     makeWASocket: jest.fn(() => ({
       sendMessage: jest.fn(),
       ev: { on: jest.fn() }
     }))
   }))
   ```
