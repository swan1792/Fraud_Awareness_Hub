"""
Modal deployment for Scammer LLM Inference Server

Deploys the FastAPI app with CPU/GPU on Modal.
The model is downloaded from Google Drive at startup.

Usage:
  1. Install Modal: pip install modal
  2. Setup: modal setup
  3. Deploy: modal deploy modal_app.py
  4. Or run locally: modal serve modal_app.py

Requires:
  - A Google Drive link to your model.gguf file
  - Set MODEL_URL secret in Modal dashboard
"""

import modal

# ─── App Setup ─────────────────────────────────────────────────
app = modal.App("scammer-llm")

# Modal image: Python + llama-cpp-python + system deps + responses dir
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi==0.115.0",
        "uvicorn[standard]==0.30.0",
        "pydantic==2.9.0",
        "llama-cpp-python==0.3.0",
        "gdown",
    )
    .apt_install("curl")
    .add_local_dir("responses", remote_path="/root/responses")
    .add_local_file("main.py", remote_path="/root/main.py")
)

# ─── Secrets ───────────────────────────────────────────────────
# Set this in Modal dashboard: modal secret create scammer-llm
#   MODEL_URL = https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing
#   N_THREADS = 4  (optional, defaults to 4)


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("scammer-llm")],
    # Use CPU for GGUF inference (no GPU needed for quantized models)
    # Upgrade to gpu="T4" if you want faster inference
    cpu=8.0,
    memory=4096,  # 4 GB RAM — more headroom for faster inference
    timeout=600,  # 10 min timeout for model download
)
@modal.web_server(port=8000)
def serve():
    """Start the FastAPI server with Modal web server."""
    import os
    import subprocess
    import threading

    model_dir = "/root/models/scammer-llm"
    model_path = os.path.join(model_dir, "model.gguf")
    os.makedirs(model_dir, exist_ok=True)

    # Download model if not present
    if not os.path.exists(model_path):
        model_url = os.environ.get("MODEL_URL", "")
        if model_url:
            print(f"Downloading model from {model_url}...")
            try:
                if "drive.google.com" in model_url:
                    # --fuzzy handles Google Drive large file confirmation pages
                    subprocess.run(
                        ["gdown", "--fuzzy", model_url, "-O", model_path],
                        check=True,
                    )
                else:
                    subprocess.run(
                        ["curl", "-L", "-o", model_path, model_url],
                        check=True,
                    )
                print(f"Model downloaded. Size: {os.path.getsize(model_path) / 1e9:.2f} GB")
            except Exception as e:
                print(f"WARNING: Failed to download model: {e}")
                print("Running in mock mode. Fix the MODEL_URL and redeploy.")
        else:
            print("WARNING: No MODEL_URL set. Running in mock mode.")
            print("Set MODEL_URL in Modal secrets: modal secret create scammer-llm")

    # Set env vars for the FastAPI app
    os.environ["MODEL_DIR"] = model_dir
    os.environ["N_THREADS"] = os.environ.get("N_THREADS", "4")

    # Start uvicorn in background thread so Modal can proxy to it
    import uvicorn
    from main import app as fastapi_app

    def run_server():
        uvicorn.run(fastapi_app, host="0.0.0.0", port=8000)

    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
