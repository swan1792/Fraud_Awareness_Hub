FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for llama.cpp
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create models directory
RUN mkdir -p /app/models/scammer-llm

# Download model at startup if MODEL_URL is set
RUN echo '#!/bin/bash\n\
if [ -n "$MODEL_URL" ] && [ ! -f "/app/models/scammer-llm/model.gguf" ]; then\n\
  echo "Downloading model from $MODEL_URL..."\n\
  curl -L -o /app/models/scammer-llm/model.gguf "$MODEL_URL"\n\
  echo "Model downloaded!"\n\
fi\n\
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}' > /app/run.sh && chmod +x /app/run.sh

EXPOSE ${PORT:-8000}

CMD ["/app/run.sh"]
