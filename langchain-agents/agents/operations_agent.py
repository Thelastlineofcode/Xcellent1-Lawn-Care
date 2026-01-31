"""Simple stub operations agent for scheduling and workflows."""

from .utils import check_weather, fetch_jobs, fetch_crews, optimize_routes

class OperationsAgent:
    def __init__(self):
        pass

    def invoke(self, payload: dict):
        task = payload.get("task")
        date = payload.get("date")

        # Check weather
        weather = check_weather(date)
        if not weather["safe"]:
             return {
                "date": date,
                "status": "cancelled",
                "reason": "Weather unsafe",
                "weather": weather
            }

        # Fetch data
        jobs = fetch_jobs(date)
        crews = fetch_crews(date)

        # Optimize routes
        # Note: Crew availability is filtered inside optimize_routes
        routes = optimize_routes(jobs, crews)

        return {
            "date": date,
            "weather": weather,
            "optimized_routes": routes
        }


operations_agent = OperationsAgent()
