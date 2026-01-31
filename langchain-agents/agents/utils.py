import math

def check_weather(date: str) -> dict:
    """
    Checks weather for a given date.
    Returns a dict with condition and safety status.
    """
    # Mock logic: Specific date is bad weather, others are sunny
    if date == "2023-12-25":
        return {"condition": "Stormy", "safe": False, "temp": 30}

    # Randomize slightly for other dates if needed, or keep deterministic
    return {"condition": "Sunny", "safe": True, "temp": 75}

def fetch_jobs(date: str) -> list:
    """
    Fetches jobs for a given date.
    Returns a list of job dicts with id and location (lat, lon).
    """
    # Mock data
    # Locations around a central point (e.g., 30.26, -97.74 for Austin)
    return [
        {"id": "job-001", "location": (30.26, -97.74), "duration_mins": 60},
        {"id": "job-002", "location": (30.27, -97.75), "duration_mins": 45},
        {"id": "job-003", "location": (30.25, -97.73), "duration_mins": 90},
        {"id": "job-004", "location": (30.28, -97.76), "duration_mins": 30},
        {"id": "job-005", "location": (30.24, -97.72), "duration_mins": 120},
    ]

def fetch_crews(date: str) -> list:
    """
    Fetches available crews for a given date.
    Returns a list of crew dicts with id and start location.
    """
    # Mock data
    return [
        {"id": "Crew-A", "start_location": (30.20, -97.70), "available": True},
        {"id": "Crew-B", "start_location": (30.30, -97.80), "available": True},
        {"id": "Crew-C", "start_location": (30.25, -97.75), "available": False}, # Unavailable crew
    ]

def calculate_distance(loc1: tuple, loc2: tuple) -> float:
    """
    Calculates Euclidean distance between two (lat, lon) tuples.
    For short distances, this is a sufficient approximation for routing relative cost.
    """
    return math.sqrt((loc1[0] - loc2[0])**2 + (loc1[1] - loc2[1])**2)

def optimize_routes(jobs: list, crews: list) -> list:
    """
    Assigns jobs to crews to minimize total distance using a greedy approach.
    """
    # Filter available crews
    available_crews = [c for c in crews if c.get("available", True)]

    if not available_crews:
        return []

    # Initialize routes
    routes = {crew["id"]: {"crew": crew["id"], "jobs": [], "total_distance": 0.0} for crew in available_crews}

    # Track current location of each crew
    crew_locations = {crew["id"]: crew["start_location"] for crew in available_crews}

    # Track unassigned jobs
    unassigned_jobs = jobs[:]

    while unassigned_jobs:
        best_assignment = None
        min_distance = float('inf')

        # Find the best (crew, job) pair
        for job in unassigned_jobs:
            for crew in available_crews:
                crew_id = crew["id"]
                dist = calculate_distance(crew_locations[crew_id], job["location"])
                if dist < min_distance:
                    min_distance = dist
                    best_assignment = (crew, job)

        if best_assignment:
            crew, job = best_assignment
            crew_id = crew["id"]

            # Assign job
            routes[crew_id]["jobs"].append(job["id"])
            routes[crew_id]["total_distance"] += min_distance

            # Update crew location
            crew_locations[crew_id] = job["location"]

            # Remove job from unassigned
            unassigned_jobs.remove(job)
        else:
            # Should not happen if there are unassigned jobs and available crews
            break

    return list(routes.values())
