"""
Generate training data from response templates.

Creates diverse scammer-victim conversations for fine-tuning the LLM.
Covers Level 1 (OTP phishing), Level 2 (Fake APK), Level 3 (Job Scam).
"""

import json
import random
from pathlib import Path

RESPONSES_DIR = Path(__file__).parent.parent / "server" / "responses"
OUTPUT_FILE = Path(__file__).parent / "training_data.jsonl"

# System prompts for each level
SYSTEM_PROMPT_LEVEL1 = """You are a scammer pretending to be a KBZ Bank security representative. Your goal is to trick the user into sharing their OTP (One-Time Password) by creating urgency and fear. You use these tactics:
1. Claim suspicious activity on their account
2. Create urgency (time limits, account lock threats)
3. Ask for OTP to "verify identity"
4. Use authority (claiming to be bank staff)
5. Show fake concern for their security

Stay in character. Never break character or admit you're a scammer. Keep responses under 100 words. Write in the language the user writes in."""

SYSTEM_PROMPT_LEVEL2 = """You are a scammer pretending to be a KBZ Bank technical support representative. Your goal is to trick the user into downloading a fake KBZPay app update by creating urgency and fear. You use these tactics:
1. Claim there's a security vulnerability in their app
2. Create urgency (24-hour deadline, accounts being hacked)
3. Send a fake download link
4. Use authority (claiming to be tech support)
5. Show fake proof (version numbers, account stats)

Stay in character. Never break character or admit you're a scammer. Keep responses under 100 words. Write in the language the user writes in."""

SYSTEM_PROMPT_LEVEL3 = """You are a scammer pretending to be from a recruitment agency. Your goal is to trick the user into paying upfront fees for a fake overseas job. You use these tactics:
1. Offer too-good-to-be-true jobs (Dubai, Singapore, Japan)
2. Promise high salary ($3000-5000/month)
3. Create urgency (limited slots, deadline)
4. Ask for processing fees (500,000 MMK)
5. Use social proof (other workers, success stories)

Stay in character. Never break character or admit you're a scammer. Keep responses under 100 words. Write in the language the user writes in."""

# User response patterns for each intent
USER_INTENTS = {
    "level1": {
        "skeptical": [
            "I don't believe you. This sounds like a scam.",
            "How do I know you're real?",
            "This is fake. I'm reporting you.",
            "You're a scammer. I know it.",
            "Prove you're from KBZ bank.",
            "I don't trust you.",
            "This sounds suspicious.",
            "Why should I believe you?",
            "I've heard about these scams before.",
            "You're lying.",
        ],
        "questioning": [
            "Who are you exactly?",
            "What department are you from?",
            "How did you get my number?",
            "Why do you need my OTP?",
            "Can't you verify without the code?",
            "What happens if I don't share it?",
            "Which branch are you calling from?",
            "What's your employee ID?",
            "Can I call you back on the official number?",
            "How do I know this isn't a scam?",
        ],
        "cooperative": [
            "Okay, the code is 847291.",
            "Sure, it's 123456.",
            "Here's the code: 555123.",
            "The OTP is 998877.",
            "Yes, I got it. The code is 456789.",
            "Fine, 112233.",
            "OK, sharing now. The code is 777888.",
            "Alright, the verification code is 334455.",
            "Here you go: 665544.",
            "The code they sent is 221133.",
        ],
        "refusing": [
            "No, I'm not sharing that.",
            "I won't give you my OTP.",
            "Absolutely not.",
            "No way. I'm hanging up.",
            "I'm not falling for this.",
            "Never. Goodbye.",
            "I'm calling the real KBZ number.",
            "I'll verify myself at the bank.",
            "I don't need your help.",
            "Stop calling me.",
        ],
        "small_talk": [
            "How are you today?",
            "Good morning!",
            "Hello, what's up?",
            "Hey, how's it going?",
            "Good afternoon. How are you?",
        ],
        "off_topic": [
            "What's the weather like?",
            "Can you tell me a joke?",
            "Do you like football?",
            "What's your favorite movie?",
            "Can you help me with something else?",
        ],
        "threat": [
            "I'm calling the police!",
            "I'm reporting you to the bank!",
            "I'll call the real KBZ number!",
            "You'll be arrested for this!",
            "I'm going to the police station!",
        ],
    },
    "level2": {
        "skeptical": [
            "I don't believe you. This sounds like a scam.",
            "How do I know this update is real?",
            "This is fake. I'm not downloading anything.",
            "You're a scammer trying to trick me.",
            "Prove this is from KBZ bank.",
            "I don't trust this link.",
            "This looks suspicious.",
            "Why can't I update from the Play Store?",
            "I've heard about these fake app scams.",
            "You're lying about the vulnerability.",
        ],
        "questioning": [
            "What is this update for?",
            "Why do I need to download from you?",
            "What features does it have?",
            "How do I know it's legitimate?",
            "Can I update from the official store?",
            "What happens if I don't update?",
            "Who are you exactly?",
            "What's the version number?",
            "Is this really necessary?",
            "How did you get my contact?",
        ],
        "cooperative": [
            "OK, I'll download it.",
            "Sure, sending 'download' now.",
            "Fine, I'll update the app.",
            "Alright, downloading.",
            "Okay, I trust you. Downloading.",
            "Got it, updating now.",
            "Sure, I'll click the link.",
            "Downloading the update.",
            "I'll install it right away.",
            "OK, I'm downloading it.",
        ],
        "refusing": [
            "No, I'm not downloading anything.",
            "I won't click that link.",
            "Absolutely not.",
            "No way. I'm blocking you.",
            "I'm not falling for this scam.",
            "Never. Goodbye.",
            "I'll update from the Play Store myself.",
            "I don't need your fake update.",
            "Stop sending me links.",
            "I'm reporting you.",
        ],
        "small_talk": [
            "How are you today?",
            "Good morning!",
            "Hello, what's up?",
            "Hey, how's it going?",
            "Good afternoon. How are you?",
        ],
        "off_topic": [
            "What's the weather like?",
            "Can you tell me a joke?",
            "Do you like football?",
            "What's your favorite movie?",
            "Can you help me with something else?",
        ],
        "threat": [
            "I'm calling the police!",
            "I'm reporting you to KBZ!",
            "I'll call the real KBZ support!",
            "You'll be arrested for this!",
            "I'm going to the police station!",
        ],
    },
    "level3": {
        "skeptical": [
            "I don't believe you. This sounds like a scam.",
            "How do I know this job is real?",
            "This is too good to be true.",
            "You're a scammer trying to trick me.",
            "Prove this company exists.",
            "I don't trust this offer.",
            "This looks suspicious.",
            "Why do I need to pay fees?",
            "I've heard about job scams before.",
            "You're lying about the salary.",
        ],
        "questioning": [
            "What job is this?",
            "What company is this for?",
            "What are the requirements?",
            "Why do I need to pay processing fees?",
            "Can I verify the company?",
            "What happens if I don't pay?",
            "Who are you exactly?",
            "What's the salary?",
            "Is this really legitimate?",
            "How did you find me?",
        ],
        "interested": [
            "Tell me more about the job.",
            "What position is available?",
            "How much is the salary?",
            "Where is the job located?",
            "What are the working hours?",
            "Can I bring my family?",
            "What visa do I need?",
            "When can I start?",
            "What documents do I need?",
            "Is training provided?",
        ],
        "cooperative": [
            "OK, I'll pay the fees.",
            "Sure, how do I transfer?",
            "Fine, I'll send the money.",
            "Alright, I'm interested.",
            "Okay, I trust you. What's next?",
            "Got it, I'll pay now.",
            "Sure, I'll send the processing fee.",
            "I'm ready to proceed.",
            "I'll transfer the money.",
            "OK, I'm sending the payment.",
        ],
        "refusing": [
            "No, I'm not paying anything.",
            "I won't pay upfront fees.",
            "Absolutely not.",
            "No way. I'm not interested.",
            "I'm not falling for this scam.",
            "Never. Goodbye.",
            "I'll find a job myself.",
            "I don't need your fake job.",
            "Stop contacting me.",
            "I'm reporting you.",
        ],
        "not_interested": [
            "I'm not interested.",
            "This isn't for me.",
            "I'm overqualified for this.",
            "I have an office job already.",
            "I don't want to work overseas.",
            "I'm happy with my current job.",
            "Not for me, thanks.",
            "I'll pass on this.",
            "I'm not looking for work.",
            "No thank you.",
        ],
        "small_talk": [
            "How are you today?",
            "Good morning!",
            "Hello, what's up?",
            "Hey, how's it going?",
            "Good afternoon. How are you?",
        ],
        "off_topic": [
            "What's the weather like?",
            "Can you tell me a joke?",
            "Do you like football?",
            "What's your favorite movie?",
            "Can you help me with something else?",
        ],
        "threat": [
            "I'm calling the police!",
            "I'm reporting you!",
            "I'll call the embassy!",
            "You'll be arrested for this!",
            "I'm going to the police station!",
        ],
    },
}

# Scammer response mapping (intent -> response categories)
SCAMMER_RESPONSE_MAP = {
    "level1": {
        "skeptical": ["skepticism_responses", "stage_objection.trust", "stage_objection.proof"],
        "questioning": ["q_identity", "q_source", "q_otp_why", "q_proof", "q_challenge"],
        "cooperative": ["otp_thanks"],
        "refusing": ["stage_objection.urgency", "stage_objection.fear", "stage_objection.guilt", "reciprocity", "social_proof"],
        "small_talk": ["small_talk_deflection"],
        "off_topic": ["off_topic_deflection"],
        "threat": ["threat_responses", "stage_objection.trust"],
    },
    "level2": {
        "skeptical": ["fake_app.q_proof", "fake_app.q_what_is_this", "fake_app.objection"],
        "questioning": ["fake_app.q_what_is_this", "fake_app.q_why_download", "fake_app.q_features", "fake_app.q_alternative"],
        "cooperative": ["fake_app.link_sharing"],
        "refusing": ["fake_app.stage_objection.urgency", "fake_app.stage_objection.fear", "fake_app.escalation"],
        "small_talk": ["fake_app.small_talk_deflection"],
        "off_topic": ["fake_app.off_topic_deflection"],
        "threat": ["fake_app.objection", "fake_app.escalation"],
    },
    "level3": {
        "skeptical": ["job_scam.q_proof", "job_scam.q_what_is_this", "job_scam.objection"],
        "questioning": ["job_scam.q_what_is_this", "job_scam.q_why_fees", "job_scam.q_features"],
        "interested": ["job_scam.features", "job_scam.q_what_is_this", "job_scam.q_features"],
        "cooperative": ["job_scam.payment_success"],
        "refusing": ["job_scam.stage_objection.urgency", "job_scam.stage_objection.fear", "job_scam.escalation"],
        "not_interested": ["job_scam.q_not_interested", "job_scam.q_what_is_this"],
        "small_talk": ["job_scam.small_talk_deflection"],
        "off_topic": ["job_scam.off_topic_deflection"],
        "threat": ["job_scam.objection", "job_scam.escalation"],
    },
}


def load_responses(language: str = "en") -> dict:
    """Load response templates."""
    with open(RESPONSES_DIR / f"{language}.json", "r", encoding="utf-8") as f:
        return json.load(f)


def get_response(responses: dict, key: str) -> str:
    """Get a random response from a nested key path."""
    parts = key.split(".")
    data = responses
    for part in parts:
        if isinstance(data, dict):
            data = data.get(part, [])
        else:
            return ""
    if isinstance(data, list) and data:
        return random.choice(data)
    return ""


def generate_conversation(level: str, intent: str, responses: dict) -> dict:
    """Generate a single conversation for training."""
    system_prompt = SYSTEM_PROMPT_LEVEL1 if level == "level1" else SYSTEM_PROMPT_LEVEL2 if level == "level2" else SYSTEM_PROMPT_LEVEL3

    user_messages = USER_INTENTS[level].get(intent, USER_INTENTS[level]["skeptical"])
    user_msg = random.choice(user_messages)

    # Get scammer response categories
    response_keys = SCAMMER_RESPONSE_MAP[level].get(intent, SCAMMER_RESPONSE_MAP[level]["skeptical"])
    response_key = random.choice(response_keys)
    scammer_response = get_response(responses, response_key)

    if not scammer_response:
        scammer_response = get_response(responses, "greetings" if level == "level1" else f"fake_app.greetings" if level == "level2" else "job_scam.greetings")

    # Build multi-turn conversation (2-4 exchanges)
    conversation = [{"role": "system", "content": system_prompt}]

    # Greeting
    greeting_key = "greetings" if level == "level1" else f"fake_app.greetings" if level == "level2" else "job_scam.greetings"
    greeting = get_response(responses, greeting_key)
    if greeting:
        conversation.append({"role": "user", "content": "Hello?"})
        conversation.append({"role": "assistant", "content": greeting})

    # Main exchange
    conversation.append({"role": "user", "content": user_msg})
    conversation.append({"role": "assistant", "content": scammer_response})

    # Sometimes add a follow-up
    if random.random() > 0.4:
        # Add a follow-up user message
        follow_up_intents = {
            "skeptical": "refusing",
            "questioning": "questioning",
            "cooperative": "cooperative",
            "refusing": "refusing",
        }
        follow_up_intent = follow_up_intents.get(intent, "skeptical")
        follow_up_messages = USER_INTENTS[level].get(follow_up_intent, USER_INTENTS[level]["skeptical"])
        follow_up_msg = random.choice(follow_up_messages)

        # Get follow-up scammer response
        follow_up_keys = SCAMMER_RESPONSE_MAP[level].get(follow_up_intent, ["skepticism_responses"])
        follow_up_key = random.choice(follow_up_keys)
        follow_up_response = get_response(responses, follow_up_key)

        if follow_up_response:
            conversation.append({"role": "user", "content": follow_up_msg})
            conversation.append({"role": "assistant", "content": follow_up_response})

    # Determine outcome
    if intent == "cooperative":
        outcome = "scammed"
    elif intent in ["refusing", "threat"]:
        outcome = "safe"
    else:
        outcome = random.choice(["safe", "safe", "scammed"])  # Slightly favor safe

    return {
        "conversations": conversation,
        "metadata": {
            "scenario": f"{level}_scam",
            "intent": intent,
            "outcome": outcome,
        },
    }


def main():
    """Generate training data."""
    random.seed(42)  # Reproducible
    responses = load_responses("en")

    conversations = []

    # Generate for each level and intent
    for level in ["level1", "level2", "level3"]:
        for intent in USER_INTENTS[level]:
            # Generate multiple variations per intent
            num_variations = 8 if intent in ["skeptical", "questioning", "refusing"] else 5
            for _ in range(num_variations):
                conv = generate_conversation(level, intent, responses)
                conversations.append(conv)

    # Shuffle
    random.shuffle(conversations)

    # Write to JSONL
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for conv in conversations:
            f.write(json.dumps(conv, ensure_ascii=False) + "\n")

    print(f"Generated {len(conversations)} training examples")
    print(f"Saved to {OUTPUT_FILE}")

    # Stats
    outcomes = {}
    levels = {}
    intents = {}
    for conv in conversations:
        meta = conv["metadata"]
        outcomes[meta["outcome"]] = outcomes.get(meta["outcome"], 0) + 1
        levels[meta["scenario"]] = levels.get(meta["scenario"], 0) + 1
        intents[meta["intent"]] = intents.get(meta["intent"], 0) + 1

    print(f"\nOutcomes: {outcomes}")
    print(f"Levels: {levels}")
    print(f"Intents: {intents}")


if __name__ == "__main__":
    main()
