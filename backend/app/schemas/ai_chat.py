from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|ai)$")
    content: str


class AIQuestion(BaseModel):
    car_id: int
    question: str
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class AIResponse(BaseModel):
    answer: str
