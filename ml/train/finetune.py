"""
QLoRA Fine-tuning Script for OTP Scam Chat Simulator

Fine-tunes a small language model on OTP scam conversations.
Supports: Qwen2-1.5B, Phi-3-mini, Gemma-2B
"""

import json
import torch
from pathlib import Path
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig

# ─── Config ───────────────────────────────────────────────────
BASE_MODEL = "Qwen/Qwen2-1.5B"  # or "microsoft/Phi-3-mini-4k-instruct"
TRAINING_DATA = Path(__file__).parent.parent / "data" / "training_data.jsonl"
OUTPUT_DIR = Path(__file__).parent / "output"
FINAL_MODEL_DIR = Path(__file__).parent / "models" / "scammer-llm"

# ─── Load Data ────────────────────────────────────────────────
def load_training_data(path: Path) -> Dataset:
    """Load JSONL training data."""
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            item = json.loads(line)
            data.append(item)
    return Dataset.from_list(data)


# ─── Format Conversations ─────────────────────────────────────
def format_conversation(example: dict, tokenizer) -> str:
    """Format conversation for SFT training."""
    messages = example["conversations"]
    return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)


# ─── Main Training ────────────────────────────────────────────
def train():
    print(f"Loading base model: {BASE_MODEL}")

    # Quantization config (4-bit)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL,
        trust_remote_code=True,
        padding_side="right",
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.float16,
    )
    model = prepare_model_for_kbit_training(model)

    # LoRA config
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Load data
    print(f"Loading training data from: {TRAINING_DATA}")
    dataset = load_training_data(TRAINING_DATA)
    print(f"Loaded {len(dataset)} examples")

    # Training arguments
    training_args = SFTConfig(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        weight_decay=0.01,
        warmup_ratio=0.1,
        lr_scheduler_type="cosine",
        logging_steps=10,
        save_strategy="epoch",
        fp16=True,
        optim="paged_adamw_32bit",
        max_seq_length=512,
        dataset_text_field="conversations",
        packing=False,
    )

    # Format data for training
    def format_for_training(example):
        messages = example["conversations"]
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
        return {"text": text}

    dataset = dataset.map(format_for_training, remove_columns=dataset.column_names)

    # Trainer
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        tokenizer=tokenizer,
    )

    # Train
    print("Starting training...")
    trainer.train()

    # Save
    print(f"Saving model to {FINAL_MODEL_DIR}")
    FINAL_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(FINAL_MODEL_DIR)
    tokenizer.save_pretrained(FINAL_MODEL_DIR)

    print("Training complete!")


if __name__ == "__main__":
    train()
