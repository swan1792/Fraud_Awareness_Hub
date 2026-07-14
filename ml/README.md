# ML Pipeline - OTP Scam Chat Simulator

This directory contains the fine-tuned language model and inference server for the scammer chat simulator.

## Architecture

```
ml/
├── data/
│   ├── seed_conversations.json    # 10 seed conversations (EN + MY)
│   ├── prepare_data.py            # Data augmentation script
│   └── training_data.jsonl        # Generated training data
├── train/
│   ├── finetune.py               # QLoRA fine-tuning script
│   └── output/                   # Training checkpoints
├── server/
│   ├── main.py                   # FastAPI inference server
│   └── requirements.txt          # Python dependencies
└── models/
    └── scammer-llm/              # Fine-tuned model (GGUF format)
```

## Quick Start

### 1. Prepare Training Data

```bash
cd ml/data
python prepare_data.py
```

This will:
- Load seed conversations
- Generate augmented variations
- Output `training_data.jsonl`

### 2. Fine-tune Model

```bash
cd ml/train
pip install -r ../server/requirements.txt
python finetune.py
```

Requirements:
- GPU with 8GB+ VRAM (or use Google Colab)
- ~30 minutes training time

### 3. Start Inference Server

```bash
cd ml/server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Start Express Backend

```bash
cd backend
npm start
```

The Express server will proxy requests to the Python sidecar at `localhost:8000`.

## API Endpoints

### Python Sidecar (port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Model status |
| POST | /chat | Generate response (non-streaming) |
| POST | /chat/stream | Generate response (SSE streaming) |

### Express Proxy (port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/simulator/health | Check LLM status |
| POST | /api/simulator/chat | Generate response |
| POST | /api/simulator/chat/stream | Stream response |

## Model Details

- **Base Model**: Qwen2-1.5B (or Phi-3-mini)
- **Fine-tuning**: QLoRA (4-bit quantized)
- **Output**: GGUF format (4-bit quantized, ~1GB)
- **Training Data**: 50 OTP scam conversations (EN + MY)
- **Inference**: llama.cpp via llama-cpp-python

## Development Mode

If the model isn't loaded, the server runs in **mock mode** with keyword-based responses. This lets you develop the frontend without a GPU.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| MODEL_DIR | models/scammer-llm | Path to GGUF model |
| MAX_TOKENS | 150 | Max response tokens |
| TEMPERATURE | 0.8 | Sampling temperature |
| MAX_CONVERSATION_LENGTH | 20 | Max messages per session |
| PYTHON_SIDECAR_URL | http://localhost:8000 | Python server URL |
