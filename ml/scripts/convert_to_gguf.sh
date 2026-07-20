#!/bin/bash
# Convert fine-tuned model to GGUF with Q4_K_M quantization
# Run this after training completes
#
# Usage:
#   ./convert_to_gguf.sh <path-to-finetuned-model> <output-dir>
#
# Example:
#   ./convert_to_gguf.sh ../train/output ./models/scammer-llm

set -e

MODEL_DIR=${1:-"../train/output"}
OUTPUT_DIR=${2:-"./models/scammer-llm"}

echo "Converting model from: $MODEL_DIR"
echo "Output directory: $OUTPUT_DIR"

# Clone llama.cpp if not present
if [ ! -d "llama.cpp" ]; then
    echo "Cloning llama.cpp..."
    git clone --depth 1 https://github.com/ggerganov/llama.cpp.git
fi

# Install requirements
pip install -r llama.cpp/requirements.txt

# Convert to GGUF F16 first
echo "Converting to GGUF F16..."
python llama.cpp/convert_hf_to_gguf.py "$MODEL_DIR" \
    --outfile "$OUTPUT_DIR/model-f16.gguf" \
    --outtype f16

# Quantize to Q4_K_M (smaller, faster, good quality)
echo "Quantizing to Q4_K_M..."
./llama.cpp/llama-quantize "$OUTPUT_DIR/model-f16.gguf" \
    "$OUTPUT_DIR/model.gguf" \
    Q4_K_M

# Remove the F16 intermediate file
rm -f "$OUTPUT_DIR/model-f16.gguf"

# Show result
echo ""
echo "Done! Model saved to: $OUTPUT_DIR/model.gguf"
ls -lh "$OUTPUT_DIR/model.gguf"
echo ""
echo "Expected size: ~800MB-1GB (vs 1.6GB for Q8_0)"
echo "This should run much faster on Railway's CPU."
