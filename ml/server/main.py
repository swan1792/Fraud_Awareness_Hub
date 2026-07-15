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
        return self.load(language).get(key, [])

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

    def _detect_intent(self, msg: str, lang: str) -> str:
        indicators = response_loader.load(lang)
        lower = msg.lower()

        if any(w in lower for w in indicators.get("end_indicators", [])):
            return "end"
        if any(w in lower for w in indicators.get("refuse_indicators", [])):
            return "refuse"
        if any(w in lower for w in indicators.get("skepticism_indicators", [])):
            return "skepticism"
        if any(w in lower for w in indicators.get("threat_indicators", [])):
            return "threat"
        if any(w in lower for w in indicators.get("small_talk_indicators", [])):
            return "small_talk"
        if any(w in lower for w in indicators.get("off_topic_indicators", [])):
            return "off_topic"
        if any(w in lower for w in indicators.get("abuse_indicators", [])):
            return "abuse"
        if any(w in lower for w in ["?", "ဘာ", "ဘယ်", "who", "what", "why", "how", "where", "which", "prove", "real", "သက်သေပြ", "ဖြစ်တယ်ဆိုတာ"]):
            return "question"
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

    def _mock_response(self, messages: List[Message], language: str) -> Optional[str]:
        user_messages = [m.content for m in messages if m.role == "user"]
        assistant_messages = [m.content for m in messages if m.role == "assistant"]
        user_lower = [m.lower() for m in user_messages]
        assistant_lower = [m.lower() for m in assistant_messages]

        if not user_messages:
            return response_loader.get_random(language, "greetings")

        last_msg = user_lower[-1]
        last_original = user_messages[-1]
        total_exchanges = len(assistant_messages)
        refusal_count = sum(1 for m in user_lower[1:] if any(w in m for w in response_loader.get(language, "refuse_indicators")))

        # Detect intent of last user message
        intent = self._detect_intent(last_original, language)

        # Check if conversation ended
        goodbye_words = response_loader.get(language, "goodbye_indicators")
        if assistant_lower:
            for msg in assistant_lower:
                if any(w in msg for w in goodbye_words):
                    return None

        # Check if user shared OTP
        if self._is_otp(last_original, language):
            return response_loader.get_random(language, "otp_thanks")

        # Check if user wants to end
        end_words = response_loader.get(language, "end_indicators")
        is_ending = any(w in last_msg for w in end_words)

        # --- Intent-based routing (highest priority) ---

        # End intent — only end when user explicitly says goodbye or after 8+ refusals
        if is_ending or intent == "end" or refusal_count >= 8:
            return response_loader.get_random(language, "stage_final")

        # Small talk intent — deflect back to urgency
        if intent == "small_talk":
            return response_loader.get_random(language, "small_talk_deflection")

        # Off-topic intent — deflect with frustration
        if intent == "off_topic":
            return response_loader.get_random(language, "off_topic_deflection")

        # Abuse intent — deflect with frustration
        if intent == "abuse":
            return response_loader.get_random(language, "abuse_deflection")

        # Question intent — route to specific question type (even on first exchange)
        if intent == "question":
            question_type = self._classify_question(last_original, language)
            response = response_loader.get_random(language, question_type)
            if response:
                return response
            # Fallback to generic proof
            return response_loader.get_nested(language, "stage_objection", "proof")

        # Skepticism intent
        if intent == "skepticism":
            return response_loader.get_random(language, "skepticism_responses")

        # Threat intent
        if intent == "threat":
            return response_loader.get_random(language, "threat_responses")

        # --- Refusal-based escalation (lower priority) ---

        if total_exchanges == 0:
            return response_loader.get_random(language, "greetings")
        elif refusal_count == 1:
            return random.choice([
                response_loader.get_random(language, "reciprocity"),
                response_loader.get_nested(language, "stage_objection", "urgency"),
                response_loader.get_nested(language, "stage_objection", "trust"),
            ])
        elif refusal_count == 2:
            return random.choice([
                response_loader.get_random(language, "social_proof"),
                response_loader.get_nested(language, "stage_objection", "fear"),
                response_loader.get_nested(language, "stage_objection", "proof"),
            ])
        elif refusal_count >= 3:
            return random.choice([
                response_loader.get_random(language, "false_intimacy"),
                response_loader.get_nested(language, "stage_objection", "guilt"),
                response_loader.get_random(language, "escalation"),
            ])
        elif total_exchanges == 1:
            return response_loader.get_random(language, "stage_trust")
        elif total_exchanges == 2:
            # Vary the approach - sometimes urgency, sometimes more trust building
            return random.choice([
                response_loader.get_random(language, "stage_urgency"),
                response_loader.get_nested(language, "stage_objection", "fear"),
                response_loader.get_nested(language, "stage_objection", "proof"),
            ])
        elif total_exchanges == 3:
            # Vary when OTP request happens - sometimes earlier, sometimes later
            return random.choice([
                response_loader.get_random(language, "stage_request"),        # 40% - ask now
                response_loader.get_nested(language, "stage_objection", "urgency"),  # 30% - delay with urgency
                response_loader.get_nested(language, "stage_objection", "fear"),     # 30% - delay with fear
            ])
        elif total_exchanges == 4:
            # More likely to ask now, but still some variation
            return random.choice([
                response_loader.get_random(language, "stage_request"),        # 50% - ask now
                response_loader.get_random(language, "stage_request"),        # 50% - ask now
                response_loader.get_nested(language, "stage_objection", "emotional"),  # 25% - guilt trip
            ])
        elif total_exchanges == 5:
            # Increase pressure with emotional manipulation
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "guilt"),
                response_loader.get_random(language, "false_intimacy"),
            ])
        elif total_exchanges == 6:
            # More urgency and social proof
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "urgency"),
                response_loader.get_random(language, "social_proof"),
            ])
        elif total_exchanges == 7:
            # Peak pressure — escalation
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_random(language, "escalation"),
                response_loader.get_nested(language, "stage_objection", "fear"),
            ])
        else:
            # Final attempts — mix of everything
            return random.choice([
                response_loader.get_random(language, "stage_request"),
                response_loader.get_nested(language, "stage_objection", "emotional"),
                response_loader.get_random(language, "social_proof"),
                response_loader.get_random(language, "escalation"),
            ])

    def generate(self, messages: List[Message], max_tokens: int, temperature: float, language: str) -> str:
        if not self.model_loaded:
            response = self._mock_response(messages, language)
            if response is None:
                return response_loader.get_random(language, "stage_final")
            return response

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

    def generate_stream(self, messages: List[Message], max_tokens: int, temperature: float, language: str):
        if not self.model_loaded:
            response = self._mock_response(messages, language)
            if response is None:
                return
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
