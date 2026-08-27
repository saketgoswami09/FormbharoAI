# FormBharo

A Chrome extension + Node.js backend to help users fill Indian exam forms by extracting data from uploaded documents using Claude's API.

## Setup

### Backend
1. `cd backend`
2. `npm install`
3. `cp .env.example .env`
4. Set `ANTHROPIC_API_KEY` in `.env`.
5. `npm start`

### Chrome Extension
1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked".
4. Select the `extension/` folder.
