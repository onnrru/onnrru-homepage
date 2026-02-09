# Auto-Deployment Setup (CI/CD)

This guide explains how to make your project deploy automatically whenever you push code to GitHub.

## 1. Frontend (Netlify)
Netlify handles this automatically!
1.  Push your code to GitHub.
2.  Go to **Netlify Dashboard** > **Site Settings** > **Build & Deploy**.
3.  Click **Link repository** and select your GitHub repo.
4.  **Done!** Every `git push` will now update your website.

## 2. Backend (Google Cloud VM)
We created a GitHub Action (`.github/workflows/deploy_backend.yml`) to update your VM automatically. You need to configure 3 secrets in GitHub.

### Step 1: Get SSH Key
You need a private SSH key to let GitHub log into your VM.
1.  **Generate a key pair** (on your local machine, not the VM):
    ```bash
    ssh-keygen -t rsa -b 4096 -C "github-action" -f ./github_deploy_key
    ```
    (Press Enter for no passphrase)
2.  **Add Public Key to VM**:
    *   **Option A: Automated (Recommended)**
        I have already generated the key for you. Run this command in your local terminal to see it:
        ```powershell
        type github_deploy_key.pub
        ```
    *   **Option B: Manual Copy**
        Copy this entire line:
        ```text
        ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD52VR9E42dFGoBIIj0375z1PYa83Iew6HU/9fnRbOF5M9/aibTGUxXwu6OIuYzPbaql/f+iZHYYZ6R2/gWDeKg1ZtQu1lWRt73QrHzXsShbS9LiceMEPKq1fAx46haYL6iB8aAVtTxmCY5DQirHIhbQghrYThNCsuzSXpb546PdBsM2rkGf0w6cxYgU1C4mrHKxZ8YmwNMPzEK2hrVbwLpO/yUG8oqbZtb7r6f2XT7djtsjGblrApMgWS+jFdiHLzeCdLKs7MBQk8Qoq5gcFbX8PFWmNDwGm8EWqdOWLg81YGRcVE9cejSRuzTjYYqd+DnEhrCFDYDS3YPtjZvB6Pqq1ZIUnSJZzDoYTTR+y9GqP8SG5+BPgE3JjBhTyeMW0I1n1FHljDgIovPjzKkLgIGL2DNHyDTk/M+MTmYXtuUFd7fzVPOZ8ivRELLwsr83NW1EW/4U8YyN6uYeiW78+sOKBV9UszKdPXjp3wGs+M8bWfEoS9qFcdG2SdAiDDhkyB5DM5DzuKazknWjEkaY0v7MMLC4ZXOgFBBN2eC+Z8ZTg6AbpJOCi67qKSTl4hfsgH/LeYFq19dJ2PGdBdOuov8zWsE8kCB8/VOskgHPPIE7EHt2i0g1utq1IM8Vuf4hjgUyA+W0mn3kyuX8/NRJaD5g1DDZPSgBDqhyX6nsmmU5Q== github-action-deploy
        ```
    *   SSH into your VM.
    *   Add it to authorized keys:
        ```bash
        nano ~/.ssh/authorized_keys
        # Paste the key on a new line, save and exit.
        ```

### Step 2: Add Secrets to GitHub
1.  Go to your **GitHub Repo** > **Settings** > **Secrets and variables** > **Actions**.
2.  Click **New repository secret**. Add these 3:

| Name | Value |
| :--- | :--- |
| `VM_HOST` | `34.50.25.171` |
| `VM_USERNAME` | Your VM username (run `whoami` on the VM to check) |
| `VM_SSH_KEY` | The content of your **private** key file (`github_deploy_key`) |

### Done!
Now, whenever you push changes to the `backend/` folder, GitHub will automatically log into your VM and update the server.
