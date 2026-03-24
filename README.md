# TruthGuard AI: News Detector System

A premium, full-stack fake news detection platform featuring a BERT-powered ML microservice, a Node.js backend, a high-impact React dashboard, and a Chrome extension.

## 🚀 Project Components

-   **/main.py**: FastAPI microservice running the BERT model with LIME explainability.
-   **/backend**: Express.js proxy with JWT authentication and MongoDB scan history.
-   **/frontend**: Vite + React dashboard with premium glassmorphism UI.
-   **/extension**: Manifest V3 Chrome extension for on-the-go scanning.

## 🛠️ Local Setup

1.  **AI Microservice**: `python -m uvicorn main:app --port 8000`
2.  **Backend**: `cd backend && npm start`
3.  **Frontend**: `cd frontend && npm run dev`

## 🌍 Deployment

Full deployment instructions for Vercel, Render, and MongoDB Atlas are available in the **Deployment Guide**:
[deployment_guide.md](.gemini/antigravity/brain/dc3e99f1-9dc4-4471-90bc-149aea38a49b/deployment_guide.md)

## 🧩 Chrome Extension
Load the `/extension` folder as an unpacked extension in Chrome developer mode.

---

Built with AI Precision. Designed for Visual Impact.
