# Google Cloud Backend Deployment Guide

This guide explains how to deploy the backend server to Google Cloud Run, ensuring it uses your reserved Static IP (`34.50.25.171`) so that the government APIs work.

## Prerequisites
1.  **Google Cloud Project**: You must have a project where you reserved the IP `34.50.25.171`.
2.  **Google Cloud CLI (gcloud)**: Installed on your local machine (or use Cloud Shell in the browser).
3.  **Billing Enabled**: Cloud Run requires billing to be enabled (though it has a generous free tier).

## Step 1: Containerize and Upload

1.  **Open a terminal** in the `onnrru/backend` directory.
2.  **Build the Docker image** and submit it to Google Container Registry (GCR) or Artifact Registry.
    ```bash
    # Replace [PROJECT_ID] with your actual Google Cloud Project ID
    gcloud builds submit --tag gcr.io/[PROJECT_ID]/onnrru-backend
    ```

## Step 2: Deploy to Cloud Run

1.  **Deploy the image**:
    ```bash
    gcloud run deploy onnrru-backend \
      --image gcr.io/[PROJECT_ID]/onnrru-backend \
      --platform managed \
      --region asia-northeast3 \
      --allow-unauthenticated \
      --set-env-vars EUM_API_KEY=[YOUR_GOVERNMENT_API_KEY],EUM_API_ID=[YOUR_GOVERNMENT_API_ID]
    ```
    *   `--region asia-northeast3`: Deploys to Seoul region for fastest speed.
    *   `--allow-unauthenticated`: Makes the API accessible publicly (so your Netlify frontend can reach it).
    *   `EUM_API_KEY`: Replace with the actual key you received from the government portal.
    *   `EUM_API_ID`: Replace with your API ID (e.g., `onnrru`).

## Step 3: Configure Static IP (Crucial!)

Cloud Run by itself has dynamic IPs. To use your fixed IP (`34.50.25.171`), you need to route requests through a **Cloud NAT** gateway.

1.  **Create a VPC Network** (if you don't have one 'default' is fine, but best to create one):
    ```bash
    gcloud compute networks create onnrru-network --subnet-mode=custom
    gcloud compute networks subnets create onnrru-subnet \
        --network=onnrru-network \
        --range=10.0.0.0/28 \
        --region=asia-northeast3
    ```

2.  **Create a Cloud Router**:
    ```bash
    gcloud compute routers create onnrru-router \
        --network=onnrru-network \
        --region=asia-northeast3
    ```

3.  **Configure Cloud NAT to use your Reserved IP**:
    *   Find the name of your reserved IP address object (not just the number 34.50.25.171). Let's assume it's named `onnrru-static-ip`.
    ```bash
    gcloud compute routers nats create onnrru-nat \
        --router=onnrru-router \
        --region=asia-northeast3 \
        --nat-external-ip-pool=onnrru-static-ip \
        --nat-all-subnet-ip-ranges
    ```

4.  **Connect Cloud Run to the VPC**:
    *   Go to the Cloud Run console -> Select `onnrru-backend`.
    *   "Edit & Deploy New Revision".
    *   "Networking" tab -> "Connect to a VPC for outbound traffic".
    *   Select "Send traffic directly to a VPC" (Direct VPC Egress).
    *   Select `onnrru-network` and `onnrru-subnet`.
    *   Deploy.

## Step 4: Verify
1.  Your Cloud Run service will have a URL (e.g., `https://onnrru-backend-xyz.a.run.app`).
2.  Update your Frontend configuration (`src/config.js` or `.env`) to use this URL.
3.  Any request from this backend to `api.eum.go.kr` will now appear to come from `34.50.25.171`.

## Troubleshooting
- **500 Error**: Check Cloud Run logs. It might be an issue with the API Key or the government API itself.
- **Connection Timeout**: Ensure the VPC Connector (if used) or Direct VPC Egress is correctly configured to the subnet.
