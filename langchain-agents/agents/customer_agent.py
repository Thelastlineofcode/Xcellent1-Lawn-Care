"""Simple stub customer agent. Replace with LangChain logic when ready."""


class CustomerServiceAgent:
    def __init__(self):
        pass

    def invoke(self, payload: dict):
        user = payload.get("input", "")
        customer_id = payload.get("customer_id")

        # TODO: wire up LangChain + tools + memory
        # For now return a friendly canned response
        return {
            "text": f"Thanks! We received your message: '{user}'. A rep will follow up soon.",
            "customer_id": customer_id,
        }


customer_service_agent = CustomerServiceAgent()
