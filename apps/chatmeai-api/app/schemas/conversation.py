from datetime import datetime

from pydantic import BaseModel


class ConversationSummary(BaseModel):
    conversation_id: str
    name: str
    created_at: datetime
    updated_at: datetime
