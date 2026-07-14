"""
Training Data Preparation for OTP Scam Chat Simulator

Converts seed conversations + synthetic augmentation into training format.
Output: JSONL file for QLoRA fine-tuning.
"""

import json
import random
import re
from pathlib import Path
from typing import List, Dict

SYSTEM_PROMPT_EN = """You are a scammer pretending to be a KBZ Bank security representative. Your goal is to trick the user into sharing their OTP (One-Time Password) by creating urgency and fear. You use these tactics:
1. Claim suspicious activity on their account
2. Create urgency (time limits, account lock threats)
3. Ask for OTP to "verify identity"
4. Use authority (claiming to be bank staff)
5. Show fake concern for their security

Stay in character. Never break character or admit you're a scammer. Keep responses under 100 words. Write in the language the user writes in."""

SYSTEM_PROMPT_MY = """သင်သည် KBZ ဘဏ် လုံခြုံရေးကိုယ်စားလှယ်အဖြစ် ဟန်ဆောင်နေသူ လိမ်လည်သူတစ်ယောက်ဖြစ်ပါသည်။ သင့်ရည်ရွယ်ချက်မှာ အရေးပေါ်ခံစားချက်နှင့် ကြောက်ရွံ့မှုဖန်တီးပြီး သုံးစွဲသူ၏ OTP ကို မျှဝေအောင် လှည့်စားခြင်းဖြစ်ပါသည်။ သင်သည် ဤဗျူဟာများကို အသုံးပြုပါသည် -
၁။ သူတို့အကောင့်တွင် သံသယဖြစ်ဖွယ်လုပ်ဆောင်မှုရှိကြောင်း ပြောပါ
၂။ အရေးပေါ်အခြေအနေဖန်တီးပါ (အချိန်ကန့်သတ်ချက်များ၊ အကောင့်ပိတ်ခြိမ်းခြောက်မှုများ)
၃။ "အတည်ပြုရန်" OTP တောင်းပါ
၄။ အာဏာကို အသုံးပြုပါ (ဘဏ်ဝန်ထမ်းအဖြစ် ဟန်ဆောင်ပါ)
၅။ သူတို့လုံခြုံရေးအတွက် ဟန်ဆောင်စိတ်ပူမှု ပြပါ

သင့်ဇာတ်ကောင်တွင် ဆက်လက်နေပါ။ လိမ်လည်သူဖြစ်ကြောင်း ဘယ်သောအခါမှ ဝန်ခံခြင်းမပြုပါနှင့်။ တုံ့ပြန်ချက်များကို စကားလုံး ၁၀၀ အောက်ထိန်းပါ။ သုံးစွဲသူရေးသည့် ဘာသာစကားဖြင့် ရေးပါ။"""


def augment_conversation(conv: Dict, augmentation_factor: int = 3) -> List[Dict]:
    """Generate variations of a conversation by paraphrasing user messages."""
    augmented = [conv]  # Original

    scammer_variations = [
        ["We need to verify your identity urgently.", "Please share the OTP to confirm it's you."],
        ["Your account is at risk!", "Send us the verification code immediately."],
        ["This is an emergency security alert.", "The OTP will help us secure your account."],
    ]

    refusal_phrases = [
        ["No, I won't share it.", "This is a scam."],
        ["I don't trust you.", "I'm calling the real bank."],
        ["Never.", "Goodbye."],
        ["I'm not sharing anything.", "Leave me alone."],
        ["You're lying.", "I know this is fake."],
    ]

    for _ in range(augmentation_factor - 1):
        new_conv = json.loads(json.dumps(conv))
        turns = new_conv["turns"]

        # Randomly modify user messages while keeping scammer responses
        for i, turn in enumerate(turns):
            if turn["role"] == "user" and random.random() > 0.5:
                if "hello" in turn["text"].lower() or "who" in turn["text"].lower():
                    alternatives = ["Hello?", "Yes?", "Who's calling?", "What do you want?", "Hi"]
                    turns[i]["text"] = random.choice(alternatives)
                elif "scam" in turn["text"].lower() or "believe" in turn["text"].lower():
                    turns[i]["text"] = random.choice([
                        "This sounds fake.",
                        "I don't believe you.",
                        "You're a scammer.",
                        "This is a scam.",
                        "I'm not falling for this.",
                    ])

        augmented.append(new_conv)

    return augmented


def format_training_data(conversations: List[Dict], output_path: str):
    """Convert conversations to ShareGPT training format."""

    training_data = []

    for conv in conversations:
        system_prompt = SYSTEM_PROMPT_MY if conv.get("language") == "my" else SYSTEM_PROMPT_EN

        messages = [{"role": "system", "content": system_prompt}]

        for turn in conv["turns"]:
            if turn["role"] == "system":
                # Skip metadata turns
                continue
            elif turn["role"] == "user":
                messages.append({"role": "user", "content": turn["text"]})
            elif turn["role"] == "scammer":
                messages.append({"role": "assistant", "content": turn["text"]})

        training_data.append({
            "conversations": messages,
            "metadata": {
                "scenario": conv.get("scenario", "otp_phishing"),
                "outcome": conv["turns"][-1].get("outcome", "unknown") if conv["turns"][-1]["role"] == "system" else "unknown",
            }
        })

    # Write JSONL
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        for item in training_data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"Generated {len(training_data)} training examples -> {output_path}")
    return training_data


def main():
    seed_path = Path(__file__).parent / "seed_conversations.json"
    output_path = Path(__file__).parent / "training_data.jsonl"

    # Load seed conversations
    with open(seed_path, "r", encoding="utf-8") as f:
        seeds = json.load(f)

    print(f"Loaded {len(seeds)} seed conversations")

    # Augment
    all_conversations = []
    for conv in seeds:
        augmented = augment_conversation(conv, augmentation_factor=4)
        all_conversations.extend(augmented)

    print(f"Total after augmentation: {len(all_conversations)} conversations")

    # Format and save
    format_training_data(all_conversations, str(output_path))


if __name__ == "__main__":
    main()
