from typing import Dict, List


class Memory:

    def __init__(self):
        self.conversations: Dict[str, List[dict]] = {}

    def get_history(self, user_id: str):
        return self.conversations.get(user_id, [])

    def add_message(self, user_id: str, role: str, content: str):
        if user_id not in self.conversations:
            self.conversations[user_id] = []

        self.conversations[user_id].append({
            "role": role,
            "content": content
        })

    def clear(self, user_id: str):
        self.conversations[user_id] = []


memory = Memory()