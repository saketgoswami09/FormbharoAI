# FormBharoAI

FormBharoAI is a Chrome extension paired with a Node.js backend designed to automate form filling. It works by "seeing" your documents (ID cards, mark sheets) via Claude's vision capabilities and auto-filling web pages based on that data.

## 🏗️ Architecture & Concepts

This project is built as a monorepo, separating the UI/Browser interaction layer from the Server/AI processing layer.

### 1. Chrome Extension (/extension)
*   **Manifest V3**: The modern standard for Chrome extensions, requiring an event-driven architecture.
*   **Content Scripts**: Run in the context of the webpage. They are responsible for scanning the DOM for inputs and injecting the values provided by the AI.
*   **Background Service Workers**: Handle cross-tab communication and act as the "traffic controller" for the extension.
*   **Popup (Vanilla JS)**: The user interface. It communicates directly with our backend via `fetch` calls.

### 2. Backend API (/backend)
*   **Node.js/Express**: A lightweight server to bridge the gap between the browser and the AI.
*   **Privacy-First Design**: We use `multer.memoryStorage()`. Document buffers are kept in RAM and never written to the disk. Once the session TTL expires, the data is gone forever.
*   **In-Memory Session Management**: Instead of a heavy database (SQL/NoSQL), we use a standard JS `Map` object to store session state (extracted data, conversation history). A `setTimeout` cleanup function ensures memory is reclaimed.

### 3. AI Integration (Claude Vision)
*   **Multimodal API**: We send image buffers directly to Claude’s Vision API. This bypasses the need for traditional OCR libraries (like Tesseract) which are often heavy, slow, and error-prone.
*   **Contextual Chat**: We feed the extracted JSON into the "system prompt" of the chat endpoint. This gives Claude "eyes" on your document while chatting with you.

---

## 🛠️ Setup Guide

### Prerequisites
*   Node.js (v18+)
*   An Anthropic API Key ([Get one here](https://console.anthropic.com/))

### 1. Backend Setup
1.  Navigate to the `/backend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Add your `ANTHROPIC_API_KEY`.
5.  Start the server: `npm start` (or `npm run dev` if you have nodemon installed).

### 2. Chrome Extension Setup
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top right.
3.  Click **Load unpacked**.
4.  Select the `extension/` folder from this project.
5.  **Important:** Copy the "ID" of the extension (a long string like `abcdefgh...`). Update your backend `.env` file with `EXTENSION_ORIGIN=chrome-extension://<YOUR_EXTENSION_ID>` to enable strict CORS security.

---

## 🎓 Learning Roadmap

If you want to understand how this code works, focus on these files in order:

1.  **`backend/src/routes/formRoutes.js`**: Understand how Express routes the API requests (`upload`, `extract`, `chat`). This is the entry point for all operations.
2.  **`backend/src/services/sessionService.js`**: Learn how to manage transient state without a database.
3.  **`backend/src/services/claudeService.js`**: See how we bridge the gap between binary file buffers and the Anthropic API.
4.  **`extension/popup.js`**: Follow the flow of data from the `input` file change listener to the server, and how we handle the response in the UI.
5.  **`extension/content.js`**: Observe how we query the DOM (`document.querySelectorAll`) to find forms and how we programmatically set their values.

