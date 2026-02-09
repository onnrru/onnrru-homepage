# Google Cloud Compute Engine (VM) Deployment Guide

Since you have set up a **Compute Engine VM** with the static IP `34.50.25.171`, this is actually the **easiest way** to get your server running with a fixed IP (required for government APIs).

## Prerequisites
1.  **SSH Access**: You need to be able to connect to your VM. You can do this by clicking the **"SSH"** button in the Google Cloud Console row for your VM.

## Step 1: Prepare the Environment
Run these commands inside your VM's SSH terminal:

1.  **Update and Install Git & Node.js**:
    ```bash
    # Update package list
    sudo apt-get update

    # Install Git
    sudo apt-get install -y git

    # Install Node.js (Version 18 or 20)
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Check installation
    node -v
    npm -v
    ```

2.  **Install PM2 (Process Manager)**:
    PM2 keeps your server running even if the terminal closes or the server crashes.
    ```bash
    sudo npm install -g pm2
    ```

## Step 2: Deploy the Code
You have two options: Clone from Git (recommended) or Upload files.

### Option A: Clone from Git (Recommended)
1.  **Clone your repository**:
    *(You might need to use an HTTPS URL or set up SSH keys if it's a private repo)*
    ```bash
    git clone https://github.com/onnrru/onnrru-homepage.git
    cd onnrru-homepage/backend
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## Step 3: Configure Environment Variables
You need to create the `.env` file on the server.

1.  **Create .env file**:
    ```bash
    nano .env
    ```
2.  **Paste the following** (Right-click to paste in Cloud Shell):
    ```env
    PORT=8080
    EUM_API_KEY=[YOUR_APPROVED_GOVERNMENT_API_KEY]
    EUM_API_ID=[YOUR_GOVERNMENT_API_ID]
    ```
    *(Replace `[...]` with your actual keys)*
3.  **Save and Exit**:
    *   Press `Ctrl + O` then `Enter` to save.
    *   Press `Ctrl + X` to exit.

## Step 4: Start the Server
1.  **Start with PM2**:
    ```bash
    pm2 start server.js --name "backend"
    ```
2.  **Save the process list** (so it restarts on boot):
    ```bash
    pm2 save
    pm2 startup
    # (Copy and paste the command output by 'pm2 startup' if prompted)
    ```

## Step 5: Firewall Setup (Crucial)
By default, Google Cloud blocks weird ports. Port `8080` needs to be open.

1.  Go to **Google Cloud Console** > **VPC Network** > **Firewall**.
2.  **Create Firewall Rule**:
    *   Name: `allow-backend-8080`
    *   Targets: `All instances in the network`
    *   Source IPv4 ranges: `0.0.0.0/0`
    *   Protocols and ports: `tcp:8080`
3.  **Click Create**.

## Step 6: Connect
Your backend is now running at:
`http://34.50.25.171:8080`

Update your frontend configuration (`src/config/api.js`) to point to this URL.
