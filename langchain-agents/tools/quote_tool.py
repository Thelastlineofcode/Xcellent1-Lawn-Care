"""Simple quote calculator placeholder."""


def calculate_quote(property_size_sqft: float, services: list):
    # Very simple pricing model: base * sqft + per-service fee
    base_per_sqft = 0.02
    service_fee = 25.0 * len(services)
    total = property_size_sqft * base_per_sqft + service_fee
    return {"estimate": round(total, 2), "currency": "USD"}
