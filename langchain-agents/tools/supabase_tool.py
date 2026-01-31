import os
from supabase import create_client, Client
try:
    from config import Config
except ImportError:
    # Fallback for relative import if running as a package or different structure
    from ..config import Config

# Initialize Supabase client
# Ensure URL and Key are available, otherwise this might fail at startup
# or we can initialize lazily.
supabase: Client = None

def get_supabase_client():
    global supabase
    if supabase is None:
        url = Config.SUPABASE_URL
        key = Config.SUPABASE_KEY
        if url and key:
            supabase = create_client(url, key)
    return supabase

def query_customer(customer_id: str):
    """
    Query the 'customers' table for a specific customer ID.
    """
    client = get_supabase_client()
    if not client:
        return {"error": "Supabase client not initialized. Check environment variables."}

    try:
        # data is a list of dictionaries
        response = client.table("customers").select("*").eq("id", customer_id).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None

    except Exception as e:
        # Log error or handle it
        return {"error": f"Failed to query customer: {str(e)}"}
