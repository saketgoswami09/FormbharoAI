# FormBharoAI

FormBharoAI is a multi-profile form automation tool. It acts as a bridge between your personal Data Cards and the web, using Google Gemini to extract data from documents and a Chrome Extension to autofill forms lightning-fast.

## 🏗️ Architecture & Concepts

This project has evolved into a robust SaaS architecture, separating data management from the browser extension execution layer.

### 1. Backend API (/backend)
*   **Database**: Uses **MongoDB** (via Mongoose) to permanently store user accounts and multi-profile Data Cards (e.g., Job Profiles, Government Exam Profiles).
*   **Authentication**: Secured via JWT (JSON Web Tokens). Users can only access and modify their own Data Cards.
*   **AI Integration**: Powered by the official **Google Gemini SDK** (`@google/genai`). We use `gemini-2.5-flash` with dynamic JSON Schema enforcement (`responseSchema`) to guarantee structured data extraction based on the *type* of profile requested.
*   **Privacy-First Extraction**: We use `multer.memoryStorage()`. Document buffers are kept in RAM, never written to disk, and immediately deleted from the session memory the moment extraction is complete.

### 2. Chrome Extension (/extension)
*   **Manifest V3**: The modern standard for Chrome extensions.
*   **Content Scripts**: Run in the context of the webpage to scan DOM inputs and inject mapped values.
*   **Message Broker**: A Background Service Worker proxies requests securely between the Popup and the Content Script.
*   **Popup**: The UI where users authenticate, select their desired Data Card, map extracted data to the detected webpage fields, and trigger the autofill.

---

## 🛠️ Setup Guide

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
*   A MongoDB database (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 1. Backend Setup
1.  Navigate to the `/backend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Configure your `.env`:
    *   `GEMINI_API_KEY`: Your Gemini API key.
    *   `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://<user>:<password>@cluster0.mongodb.net/formbharo`).
    *   `JWT_SECRET`: A long, random string used to sign auth tokens.
5.  Start the server: `npm run dev` (or `npm start`).

### 2. Chrome Extension Setup
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top right.
3.  Click **Load unpacked**.
4.  Select the `extension/` folder from this project.
5.  *(Optional for strict security)* Copy the "ID" of the extension and update your backend `.env` file with `EXTENSION_ORIGIN=chrome-extension://<YOUR_EXTENSION_ID>`.

---

## 🚀 The Multi-Profile Pipeline

1.  **Onboarding**: A user registers an account (`POST /api/auth/register`).
2.  **Document Upload**: The user uploads an ID or Resume (`POST /api/upload`).
3.  **Smart Extraction**: The backend asks Gemini to extract data based on a specific context (`POST /api/extract` with `profileType: 'job'`).
4.  **Save Data Card**: The user reviews the extracted data and saves it permanently to their account as a named Data Card (`POST /api/datacards`).
5.  **Autofill**: The user opens the Chrome Extension on a target website, fetches their Data Card (`GET /api/datacards/:id`), maps the fields, and injects the data!

