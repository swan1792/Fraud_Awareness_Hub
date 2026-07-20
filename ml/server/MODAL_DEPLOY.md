# Deploy Scammer LLM on Modal

## Why Modal?

- **Free tier**: $30/mo credit (enough for ~300 GPU-hours or lots of CPU)
- **GPU available**: T4, A10G, A100 if you need speed
- **No cold starts for web endpoints**: stays warm
- **Pay per use**: scale to zero when idle

## Setup

### 1. Install Modal CLI

```bash
pip install modal
```

### 2. Authenticate

```bash
modal setup
```

This opens a browser — log in and authorize.

### 3. Create a Secret

Store your model URL in Modal's secret manager:

```bash
modal secret create scammer-llm \
  MODEL_URL="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing" \
  N_THREADS=4
```

**How to get a Google Drive link:**
1. Upload `model.gguf` to your Google Drive
2. Right-click → Share → "Anyone with the link"
3. Copy the link — it looks like:
   `https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing`

### 4. Deploy

```bash
cd ml/server
modal deploy modal_app.py
```

First deploy takes ~2-3 minutes (downloads the model). Subsequent deploys are fast.

### 5. Get Your URL

After deployment, Modal prints a URL like:
```
https://your-username--scammer-llm-serve.modal.run
```

Test it:
```bash
curl https://your-username--scammer-llm-serve.modal.run/health
```

## Connect to Express Backend

Update your Express backend to call the Modal endpoint:

```js
// In backend/server.js, add:
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

// Proxy endpoint for the chat
app.post('/api/chat', async (req, res) => {
  const response = await fetch(`${ML_SERVICE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  })
  // ... stream or return response
})
```

Set the env var in Railway:
```
ML_SERVICE_URL=https://your-username--scammer-llm-serve.modal.run
```

## Local Development

Run the Modal app locally (no deploy needed):

```bash
cd ml/server
modal serve modal_app.py
```

This gives you a local URL like `http://localhost:8000` that runs on Modal's infrastructure.

## Costs

| Component | Cost |
|---|---|
| CPU endpoint (idle) | ~$0.02/hr |
| CPU endpoint (active) | ~$0.08/hr (4 vCPU) |
| GPU T4 (if needed) | ~$0.59/hr |
| Model storage | Free (downloaded at startup) |

With the $30/mo free credit, you can run CPU inference for **hundreds of hours**.

## Troubleshooting

**Model not downloading?**
- Check the Google Drive link is public ("Anyone with the link")
- Check Modal logs: `modal logs scammer-llm`

**Out of memory?**
- Increase `memory=2048` in `modal_app.py`
- Or use a smaller quantization (Q3_K_S instead of Q4_K_M)

**Cold start too slow?**
- The model downloads on first request. After that, it stays warm.
- Set `scaledown_window=300` to keep it alive longer.
