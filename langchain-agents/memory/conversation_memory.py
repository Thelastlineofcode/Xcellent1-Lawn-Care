"""Very small in-memory conversation store (per-customer)."""

from typing import List, Dict

customer_memories: Dict[str, List[str]] = {}


def add_message(customer_id: str, message: str):
    if customer_id not in customer_memories:
        customer_memories[customer_id] = []
    customer_memories[customer_id].append(message)


def get_history(customer_id: str):
    return customer_memories.get(customer_id, [])
