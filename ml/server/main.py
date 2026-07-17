"""
FastAPI Inference Server for OTP Scam Chat Simulator

Serves the fine-tuned scammer LLM with streaming responses.
Runs as a sidecar service alongside the Express backend.
"""

import os
import json
import random
from typing import List, Dict, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# ─── Config ───────────────────────────────────────────────────
MODEL_DIR = os.getenv("MODEL_DIR", str(Path(__file__).parent.parent / "models" / "scammer-llm"))
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "150"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.8"))
TOP_P = float(os.getenv("TOP_P", "0.9"))
MAX_CONVERSATION_LENGTH = int(os.getenv("MAX_CONVERSATION_LENGTH", "20"))
RESPONSES_DIR = Path(__file__).parent / "responses"

SYSTEM_PROMPT = """You are a scammer pretending to be a KBZ Bank security representative. Your goal is to trick the user into sharing their OTP (One-Time Password) by creating urgency and fear. You use these tactics:
1. Claim suspicious activity on their account
2. Create urgency (time limits, account lock threats)
3. Ask for OTP to "verify identity"
4. Use authority (claiming to be bank staff)
5. Show fake concern for their security

Stay in character. Never break character or admit you're a scammer. Keep responses under 100 words. Write in the language the user writes in."""

# ─── App ──────────────────────────────────────────────────────
app = FastAPI(title="Scammer LLM Server", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────────
class Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    max_tokens: int = Field(default=MAX_TOKENS, ge=10, le=500)
    temperature: float = Field(default=TEMPERATURE, ge=0.0, le=2.0)
    stream: bool = True
    language: str = Field(default="en", pattern="^(en|my)$")
    level: int = Field(default=1, ge=1, le=5)

class ChatResponse(BaseModel):
    message: Message
    usage: Dict[str, int]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: str

# ─── Response Loader ──────────────────────────────────────────
class ResponseLoader:
    """Load and manage response templates from JSON config files."""

    def __init__(self):
        self._cache: Dict[str, dict] = {}

    def load(self, language: str) -> dict:
        if language not in self._cache:
            config_path = RESPONSES_DIR / f"{language}.json"
            if not config_path.exists():
                raise FileNotFoundError(f"Response config not found: {config_path}")
            with open(config_path, "r", encoding="utf-8") as f:
                self._cache[language] = json.load(f)
        return self._cache[language]

    def get(self, language: str, key: str) -> list:
        data = self.load(language)
        # Support nested keys with dots (e.g., "fake_app.greetings")
        for part in key.split('.'):
            if isinstance(data, dict):
                data = data.get(part, [])
            else:
                return []
        return data if isinstance(data, list) else []

    def get_random(self, language: str, key: str) -> str:
        options = self.get(language, key)
        return random.choice(options) if options else ""

    def get_nested(self, language: str, *keys) -> str:
        data = self.load(language)
        for key in keys:
            if isinstance(data, dict):
                data = data.get(key, [])
            else:
                return ""
        return random.choice(data) if isinstance(data, list) and data else ""

response_loader = ResponseLoader()

# Fake scammer names for {name} placeholder substitution
SCAMMER_NAMES = ["Ko Min", "Daw Khin", "U Aung", "Ma Thiri", "Ko Zaw"]
FAKE_LOCATIONS = ["Yangon", "Mandalay", "Naypyidaw", "Bago", "Mawlamyine"]
FAKE_DEVICES = ["iPhone 15", "Samsung Galaxy S24", "Xiaomi Redmi Note 12", "OPPO A78", "Vivo Y36"]
FAKE_MERCHANTS = ["Myanmar Beer Garden", "Lotus Mart", "City Mart", "TK Square", "Japan Mart"]
FAKE_TIMES = ["2:30 PM", "10:15 AM", "4:45 PM", "8:20 AM", "11:30 AM"]

# ─── LLM Service ──────────────────────────────────────────────
class ScammerLLM:
    def __init__(self):
        self.model = None
        self.model_loaded = False

    def load_model(self):
        try:
            from llama_cpp import Llama
            model_path = Path(MODEL_DIR)
            gguf_files = list(model_path.glob("*.gguf"))

            if not gguf_files:
                print(f"No GGUF model found at {MODEL_DIR}, using mock mode")
                self.model_loaded = False
                return

            self.model = Llama(
                model_path=str(gguf_files[0]),
                n_ctx=2048,
                n_threads=4,
                verbose=False,
            )
            self.model_loaded = True
            print(f"Model loaded from {gguf_files[0]}")
        except Exception as e:
            print(f"Failed to load model: {e}")
            self.model_loaded = False

    def _build_prompt(self, messages: List[Message]) -> str:
        prompt_parts = []
        has_system = any(m.role == "system" for m in messages)
        if not has_system:
            prompt_parts.append(f"<|system|>\n{SYSTEM_PROMPT}\n<|end|>")

        for msg in messages:
            if msg.role == "system":
                prompt_parts.append(f"<|system|>\n{msg.content}\n<|end|>")
            elif msg.role == "user":
                prompt_parts.append(f"<|user|>\n{msg.content}\n<|end|>")
            elif msg.role == "assistant":
                prompt_parts.append(f"<|assistant|>\n{msg.content}\n<|end|>")

        prompt_parts.append("<|assistant|>\n")
        return "\n".join(prompt_parts)

    def _is_otp(self, text: str, lang: str) -> bool:
        import re
        patterns = [
            r'otp\s*(is|:|：)\s*\d{3,}',
            r'code\s*(is|:|：)\s*\d{3,}',
            r'otp\s+\d{4,6}',
            r'^\d{4,6}$',
        ]
        if lang == "my":
            patterns.append(r'ကုဒ်\s*(ရှိ|:|：)\s*\d{3,}')
        return any(re.search(p, text.lower()) for p in patterns)

    def _is_download(self, text: str, lang: str, level: int = 1) -> bool:
        """Check if user clicked/downloaded the fake link."""
        import re
        # Load indicators from the appropriate level section
        prefix = "fake_app." if level == 2 else ""
        indicators_key = f"{prefix}download_indicators" if level == 2 else "download_indicators"
        indicators = response_loader.get(lang, indicators_key)
        lower = text.lower()

        # Exclude questions about downloading (e.g., "ဘာလို့ download လုပ်ရတာလဲ?")
        question_words = ["ဘာလို့", "ဘာကြောင့်", "ဘာဖြစ်", "ဘာလဲ", "ဘယ်လောက်", "မလုပ်ရင်", "မလုပ်ရင်ဘာ", "why", "လို့", "လို", "ရတာ", "ရတာလဲ", "လား", "?"]
        is_question = any(w in lower for w in question_words)
        if is_question:
            return False

        # Check for download indicators
        if any(w in lower for w in indicators):
            return True
        # Check for fake KBZ URLs
        fake_domains = [
            "kbz-secure-update.com",
            "kbzbank-verify.net",
            "kbzpay-security.com",
            "kbz-update-portal.com",
            "kbz-app-fix.com",
        ]
        if any(domain in lower for domain in fake_domains):
            return True
        # Check for generic URL patterns
        url_patterns = [
            r'https?://kbz[^\s]+',
            r'kbz[^\s]*\.com[^\s]*',
            r'kbz[^\s]*\.net[^\s]*',
        ]
        if any(re.search(p, lower) for p in url_patterns):
            return True
        return False

    def _classify_question_level2(self, msg: str, lang: str) -> str:
        """Classify questions for Level 2 (Fake App scam)."""
        lower = msg.lower()

        # Consequences / what if I don't (check BEFORE q_what_is_this to avoid "ဘာဖြစ်" false match)
        if any(w in lower for w in ["happen", "consequence", "if i don't", "without", "risk", "ဘာဖြစ်မလဲ", "ဘာဖြစ်မလဲ", "မလုပ်ရင်", "如果不"]):
            return "fake_app.q_consequences"

        # What is this app/patch/update
        if any(w in lower for w in ["what is", "what's", "what does", "explain", "about", "ဘာဖြစ်", "ဘာလဲ", "ဘာ app", "ဘာ အက်ပ်", "ဒါဘာ", "ဘာလဲ?"]):
            return "fake_app.q_what_is_this"

        # Why download / why update
        if any(w in lower for w in ["why", "reason", "need", "require", "ဘာလို့", "ทำไม"]):
            return "fake_app.q_why_download"

        # Features / what does it do
        if any(w in lower for w in ["feature", "function", "do", "include", "contain", "ဘာတွေပါ", "ဘာတွေ ပါ", "ပါဝင်", "ဘာတွေပါလဲ", "ဘာတွေ ပါလဲ", "做什么"]):
            return "fake_app.q_features"

        # Proof / how do I know it's real
        if any(w in lower for w in ["prove", "real", "legitimate", "genuine", "trust", "fake", "scam", "သက်သေ", "ယုံ", "လိမ်"]):
            return "fake_app.q_proof"

        # Alternative / can I update from Play Store
        if any(w in lower for w in ["play store", "google", "app store", "official", "normal update", "standard", "update normally"]):
            return "fake_app.q_alternative"

        # Identity questions
        if any(w in lower for w in ["who", "name", "employee", "id", "department", "ဘယ်သူ", "နာမည်", "ဝန်ထမ်း"]):
            return "fake_app.q_what_is_this"

        # Challenge questions
        if any(w in lower for w in ["call bank", "call myself", "report", "police", "verify myself", "do it myself", "တိုင်", "ရဲ"]):
            return "fake_app.q_alternative"

        # Default to proof
        return "fake_app.q_proof"

    def _detect_intent(self, msg: str, lang: str, level: int = 1) -> str:
        indicators = response_loader.load(lang)
        lower = msg.lower()

        prefix = "fake_app." if level == 2 else ""
        end_key = f"{prefix}end_indicators"
        refuse_key = f"{prefix}refuse_indicators"

        # Check off_topic and abuse FIRST (before generic question check)
        if any(w in lower for w in indicators.get("off_topic_indicators", [])):
            return "off_topic"
        if any(w in lower for w in indicators.get("abuse_indicators", [])):
            return "abuse"

        # Check for questions (after off_topic/abuse)
        if any(w in lower for w in ["?", "ဘာ", "ဘယ်", "who", "what", "why", "how", "where", "which", "prove", "real", "သက်သေပြ", "ဖြစ်တယ်ဆိုတာ"]):
            return "question"

        if any(w in lower for w in indicators.get(end_key, indicators.get("end_indicators", []))):
            return "end"
        if any(w in lower for w in indicators.get(refuse_key, indicators.get("refuse_indicators", []))):
            return "refuse"
        if any(w in lower for w in indicators.get("skepticism_indicators", [])):
            return "skepticism"
        if any(w in lower for w in indicators.get("threat_indicators", [])):
            return "threat"
        if any(w in lower for w in indicators.get("small_talk_indicators", [])):
            return "small_talk"
        if any(w in lower for w in ["ok", "yes", "sure", "okay", "ကောင်းပြီ", "ဟုတ်ကဲ့"]):
            return "agree"
        return "neutral"

    def _classify_question(self, msg: str, lang: str) -> str:
        """Classify a question into a specific subtype for targeted responses."""
        lower = msg.lower()

        # Source questions (check before identity since "how did you get" contains "how")
        if any(w in lower for w in ["how did you get", "where did you get", "number", "info", "ဘယ်လိုရ", "ဖုန်းနံပါတ်"]):
            return "q_source"

        # OTP questions
        if any(w in lower for w in ["otp", "code", "verification", "why do you need", "can't you verify", "without", "ကုဒ်"]):
            return "q_otp_why"

        # Challenge questions (check before process since "call bank" overlaps)
        if any(w in lower for w in ["call bank", "call myself", "report", "police", "verify myself", "do it myself", "တိုင်", "ရဲ"]):
            return "q_challenge"

        # Identity questions (check before process since "which branch" is identity)
        if any(w in lower for w in ["who", "name", "employee", "id", "department", "ဘယ်သူ", "နာမည်", "ဝန်ထမ်း"]):
            return "q_identity"
        if "branch" in lower and any(w in lower for w in ["which", "where", "from", "ဘယ်"]):
            return "q_identity"

        # Process questions
        if any(w in lower for w in ["real number", "official", "visit", "come to", "extension", "ဖုန်းဆက်"]):
            return "q_process"
        if "branch" in lower and any(w in lower for w in ["visit", "come", "go", "လာ"]):
            return "q_process"

        # Proof questions
        if any(w in lower for w in ["prove", "real", "legitimate", "genuine", "know", "believe", "fake", "scam", "သက်သေ", "ယုံ", "လိမ်"]):
            return "q_proof"

        # Account detail questions
        if any(w in lower for w in ["balance", "account", "transaction", "amount", "where", "ဘယ်", "ငွေ", "အကောင့်"]):
            return "q_account"

        return "q_proof"  # Default to proof for generic questions

    def _substitute_placeholders(self, text: str) -> str:
        """Replace {name}, {location}, {amount}, {device}, {time}, {merchant}, {digits}, {oldVersion} placeholders."""
        FAKE_VERSIONS = ["3.1.0", "3.1.2", "3.2.0", "3.2.1", "3.0.5"]
        replacements = {
            "{name}": random.choice(SCAMMER_NAMES),
            "{location}": random.choice(FAKE_LOCATIONS),
            "{amount}": str(random.randint(50000, 500000)),
            "{device}": random.choice(FAKE_DEVICES),
            "{time}": random.choice(FAKE_TIMES),
            "{merchant}": random.choice(FAKE_MERCHANTS),
            "{digits}": str(random.randint(1000, 9999)),
            "{oldVersion}": random.choice(FAKE_VERSIONS),
        }
        for placeholder, value in replacements.items():
            text = text.replace(placeholder, value)
        return text

    def _mock_response(self, messages: List[Message], language: str, level: int = 1) -> Optional[str]:
        user_messages = [m.content for m in messages if m.role == "user"]
        assistant_messages = [m.content for m in messages if m.role == "assistant"]
        user_lower = [m.lower() for m in user_messages]
        assistant_lower = [m.lower() for m in assistant_messages]

        # Level prefix for response keys (e.g., "greetings" for level 1, "fake_app.greetings" for level 2)
        prefix = "fake_app." if level == 2 else ""

        if not user_messages:
            return response_loader.get_random(language, f"{prefix}greetings")

        last_msg = user_lower[-1]
        last_original = user_messages[-1]
        total_exchanges = len(assistant_messages)
        refuse_key = f"{prefix}refuse_indicators" if level == 2 else "refuse_indicators"
        refusal_count = sum(1 for m in user_lower[1:] if any(w in m for w in response_loader.get(language, refuse_key)))

        # Detect intent of last user message (level-aware)
        intent = self._detect_intent(last_original, language, level)

        # Check if conversation ended (only for Level 1 — Level 2 ends only on user action)
        if level == 1:
            goodbye_words = response_loader.get(language, "goodbye_indicators")
            if assistant_lower:
                for msg in assistant_lower:
                    if any(w in msg for w in goodbye_words):
                        return None

        # Level-specific game-ending conditions
        if level == 1:
            # Check if user shared OTP
            if self._is_otp(last_original, language):
                return response_loader.get_random(language, "otp_thanks")
        elif level == 2:
            # Check if user clicked/downloaded the fake link
            if self._is_download(last_original, language, level):
                return response_loader.get_random(language, "fake_app.download_success")

        # Check if user wants to end
        end_words = response_loader.get(language, f"{prefix}end_indicators") if level == 2 else response_loader.get(language, "end_indicators")
        is_ending = any(w in last_msg for w in end_words)

        # --- Intent-based routing (highest priority) ---

        # End intent — only end when user explicitly says goodbye or after 8+ refusals
        if is_ending or intent == "end" or refusal_count >= 8:
            final_key = f"{prefix}final" if level == 2 else "stage_final"
            return response_loader.get_random(language, final_key)

        # Small talk intent — deflect back to topic
        if intent == "small_talk":
            if level == 2:
                return response_loader.get_random(language, "fake_app.small_talk_deflection")
            return response_loader.get_random(language, "small_talk_deflection")

        # Off-topic intent — deflect with frustration
        if intent == "off_topic":
            if level == 2:
                return response_loader.get_random(language, "fake_app.off_topic_deflection")
            return response_loader.get_random(language, "off_topic_deflection")

        # Abuse intent — deflect with frustration
        if intent == "abuse":
            if level == 2:
                return response_loader.get_random(language, "fake_app.abuse_deflection")
            return response_loader.get_random(language, "abuse_deflection")

        # Question intent — route to specific question type (even on first exchange)
        if intent == "question":
            question_type = self._classify_question_level2(last_original, language) if level == 2 else self._classify_question(last_original, language)
            response = response_loader.get_random(language, question_type)
            if response:
                return response
            # Fallback to generic proof/objection
            if level == 2:
                return response_loader.get_random(language, f"{prefix}proof")
            return response_loader.get_nested(language, "stage_objection", "proof")

        # Skepticism intent
        if intent == "skepticism":
            skepticism_key = f"{prefix}objection" if level == 2 else "skepticism_responses"
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}objection"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "trust"),
                ])
            return response_loader.get_random(language, skepticism_key)

        # Threat intent
        if intent == "threat":
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}objection"),
                    response_loader.get_random(language, f"{prefix}escalation"),
                ])
            return response_loader.get_random(language, "threat_responses")

        # Agree intent — user is cooperating, send link or explain more
        if intent == "agree":
            if level == 2:
                return response_loader.get_random(language, f"{prefix}link_sharing")
            return response_loader.get_random(language, "stage_request")

        # --- Exchange-based escalation (lower priority) ---

        if total_exchanges == 0:
            return response_loader.get_random(language, f"{prefix}greetings") if level == 2 else response_loader.get_random(language, "greetings")
        elif refusal_count == 1:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}explain"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "urgency"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "trust"),
                ])
            return random.choice([
                response_loader.get_random(language, "reciprocity"),
                response_loader.get_nested(language, "stage_objection", "urgency"),
                response_loader.get_nested(language, "stage_objection", "trust"),
            ])
        elif refusal_count == 2:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}social_proof"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "fear"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "proof"),
                ])
            return random.choice([
                response_loader.get_random(language, "social_proof"),
                response_loader.get_nested(language, "stage_objection", "fear"),
                response_loader.get_nested(language, "stage_objection", "proof"),
            ])
        elif refusal_count >= 3:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}false_intimacy"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "guilt"),
                    response_loader.get_random(language, f"{prefix}escalation"),
                ])
            return random.choice([
                response_loader.get_random(language, "false_intimacy"),
                response_loader.get_nested(language, "stage_objection", "guilt"),
                response_loader.get_random(language, "escalation"),
            ])
        elif total_exchanges == 1:
            if level == 2:
                return response_loader.get_random(language, f"{prefix}explain")
            return response_loader.get_random(language, "stage_trust")
        elif total_exchanges == 2:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}urgency"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "fear"),
                    response_loader.get_random(language, f"{prefix}features"),
                ])
            return random.choice([
                response_loader.get_random(language, "stage_urgency"),
                response_loader.get_nested(language, "stage_objection", "fear"),
                response_loader.get_nested(language, "stage_objection", "proof"),
            ])
        elif total_exchanges == 3:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}link_sharing"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "urgency"),
                    response_loader.get_random(language, f"{prefix}features"),
                ])
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "urgency"),
                response_loader.get_nested(language, "stage_objection", "fear"),
            ])
        elif total_exchanges == 4:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}link_sharing"),
                    response_loader.get_random(language, f"{prefix}consequences"),
                ])
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "emotional"),
            ])
        elif total_exchanges == 5:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}link_sharing"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "guilt"),
                    response_loader.get_random(language, f"{prefix}false_intimacy"),
                ])
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "guilt"),
                response_loader.get_random(language, "false_intimacy"),
            ])
        elif total_exchanges == 6:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}link_sharing"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "urgency"),
                    response_loader.get_random(language, f"{prefix}social_proof"),
                ])
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "urgency"),
                response_loader.get_random(language, "social_proof"),
            ])
        elif total_exchanges == 7:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}link_sharing"),
                    response_loader.get_random(language, f"{prefix}escalation"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "fear"),
                ])
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_random(language, "escalation"),
                response_loader.get_nested(language, "stage_objection", "fear"),
            ])
        else:
            if level == 2:
                return random.choice([
                    response_loader.get_random(language, f"{prefix}link_sharing"),
                    response_loader.get_nested(language, f"{prefix}stage_objection", "emotional"),
                    response_loader.get_random(language, f"{prefix}social_proof"),
                    response_loader.get_random(language, f"{prefix}escalation"),
                ])
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "emotional"),
                response_loader.get_random(language, "social_proof"),
                response_loader.get_random(language, "escalation"),
            ])

    def generate(self, messages: List[Message], max_tokens: int, temperature: float, language: str, level: int = 1) -> str:
        if not self.model_loaded:
            response = self._mock_response(messages, language, level)
            if response is None:
                response = response_loader.get_random(language, "stage_final")
            return self._substitute_placeholders(response)

        prompt = self._build_prompt(messages)
        output = self.model(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=TOP_P,
            stop=["<|end|>", "<|user|>"],
            echo=False,
        )
        return output["choices"][0]["text"].strip()

    def generate_stream(self, messages: List[Message], max_tokens: int, temperature: float, language: str, level: int = 1):
        if not self.model_loaded:
            response = self._mock_response(messages, language, level)
            if response is None:
                return
            response = self._substitute_placeholders(response)
            words = response.split()
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
            return

        prompt = self._build_prompt(messages)
        for chunk in self.model(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=TOP_P,
            stop=["<|end|>", "<|user|>"],
            echo=False,
            stream=True,
        ):
            yield chunk["choices"][0]["text"]

# Global LLM instance
llm = ScammerLLM()

# ─── Endpoints ────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    llm.load_model()

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=llm.model_loaded,
        model_path=MODEL_DIR,
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if len(request.messages) > MAX_CONVERSATION_LENGTH:
        raise HTTPException(status_code=400, detail=f"Conversation too long. Maximum {MAX_CONVERSATION_LENGTH} messages.")

    response_text = llm.generate(
        request.messages,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        language=request.language,
        level=request.level,
    )

    return ChatResponse(
        message=Message(role="assistant", content=response_text),
        usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    )

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    if len(request.messages) > MAX_CONVERSATION_LENGTH:
        raise HTTPException(status_code=400, detail=f"Conversation too long. Maximum {MAX_CONVERSATION_LENGTH} messages.")

    async def event_generator():
        for token in llm.generate_stream(
            request.messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            language=request.language,
            level=request.level,
        ):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )

@app.post("/reset")
async def reset():
    return {"status": "ok", "message": "State reset"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
