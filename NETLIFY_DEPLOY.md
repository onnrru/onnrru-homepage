# Netlify Frontend Deployment Guide

This guide explains how to deploy your frontend to Netlify and connect it to your Google Cloud backend.

## Prerequisites
1.  **Backend Running**: Your backend must be running on your Google Cloud VM (`http://34.50.25.171:8080`).
2.  **Frontend Built**: You need to generate the `dist` folder.

## Step 1: Build the Frontend
Run this command in your local terminal:
```bash
npm run build
```
This will create a `dist` folder in your project directory.

## Step 2: Deploy to Netlify
1.  Go to [Netlify Drop](https://app.netlify.com/drop).
2.  **Drag and drop** the `dist` folder onto the page.
3.  Netlify will upload and publish your site.

## Step 3: Verify Connection
1.  Open your new Netlify URL (e.g., `https://random-name.netlify.app`).
2.  Select an address (e.g., Songpa-gu).
3.  Check the "Notice" or "Permits" tabs.
    *   **Success**: Data loads!
    *   **Failure**: Check the Network tab in Developer Tools (F12).

## How it Works (Configuration)
We have configured a **Proxy** to solve security issues:
*   **Your Config**: `netlify.toml` tells Netlify to forward any request starting with `/api/` to `http://34.50.25.171:8080/api/`.
*   **Benefit**: This allows your *HTTPS* Netlify site to talk to your *HTTP* backend without "Mixed Content" errors.
