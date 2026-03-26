from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from config import Config
from agents.customer_agent import customer_service_agent
from agents.operations_agent import operations_agent

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)


@app.route("/", methods=["GET"])
def health():
    return jsonify({"ok": True, "service": "langchain-agents", "env": app.config.get('FLASK_ENV', 'production')})


@app.route("/api/agent/inquiry", methods=["POST"])
def handle_inquiry():
    data = request.json or {}
    user_message = data.get("message", "")
    customer_id = data.get("customer_id")

    # Call the customer service agent (stubbed)
    try:
        response = customer_service_agent.invoke({
            "input": user_message,
            "customer_id": customer_id,
        })
        return jsonify({"ok": True, "response": response})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/agent/schedule", methods=["POST"])
def auto_schedule():
    data = request.json or {}
    date = data.get("date")

    try:
        schedule = operations_agent.invoke({
            "task": "optimize_schedule",
            "date": date,
        })
        return jsonify({"ok": True, "schedule": schedule})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
