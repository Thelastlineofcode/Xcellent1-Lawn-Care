import unittest
import sys
import os

# Add parent directory to path to allow importing agents
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.utils import check_weather, calculate_distance, optimize_routes, fetch_jobs, fetch_crews
from agents.operations_agent import operations_agent

class TestOperationsAgent(unittest.TestCase):
    def test_check_weather(self):
        self.assertFalse(check_weather("2023-12-25")["safe"])
        self.assertTrue(check_weather("2023-01-01")["safe"])

    def test_calculate_distance(self):
        # 3-4-5 triangle
        p1 = (0, 0)
        p2 = (3, 4)
        self.assertEqual(calculate_distance(p1, p2), 5.0)

    def test_optimize_routes(self):
        jobs = [{"id": "j1", "location": (0, 1)}, {"id": "j2", "location": (0, 10)}]
        crews = [{"id": "c1", "start_location": (0, 0), "available": True}]

        routes = optimize_routes(jobs, crews)
        self.assertEqual(len(routes), 1)
        self.assertEqual(routes[0]["crew"], "c1")
        # Greedy: (0,0) -> (0,1) is dist 1. Then (0,1) -> (0,10) is dist 9. Total 10.
        self.assertEqual(routes[0]["jobs"], ["j1", "j2"])
        self.assertEqual(routes[0]["total_distance"], 10.0)

    def test_optimize_routes_unavailable_crew(self):
        jobs = [{"id": "j1", "location": (0, 1)}]
        crews = [{"id": "c1", "start_location": (0, 0), "available": False}]
        routes = optimize_routes(jobs, crews)
        self.assertEqual(len(routes), 0)

    def test_agent_invoke_safe_weather(self):
        result = operations_agent.invoke({"task": "optimize", "date": "2023-06-01"})
        self.assertTrue(result["weather"]["safe"])
        self.assertIn("optimized_routes", result)
        # We expect mocked jobs and crews to result in some routes
        self.assertGreater(len(result["optimized_routes"]), 0)

    def test_agent_invoke_unsafe_weather(self):
        result = operations_agent.invoke({"task": "optimize", "date": "2023-12-25"})
        self.assertEqual(result["status"], "cancelled")
        self.assertFalse(result["weather"]["safe"])

if __name__ == '__main__':
    unittest.main()
