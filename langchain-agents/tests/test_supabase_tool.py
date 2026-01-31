import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add langchain-agents to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from tools.supabase_tool import query_customer
import tools.supabase_tool

class TestSupabaseTool(unittest.TestCase):

    def setUp(self):
        # Reset the global supabase client before each test
        tools.supabase_tool.supabase = None

    @patch('tools.supabase_tool.Config')
    @patch('tools.supabase_tool.create_client')
    def test_query_customer_success(self, mock_create_client, mock_config):
        # Setup mock config
        mock_config.SUPABASE_URL = "http://fake-url.com"
        mock_config.SUPABASE_KEY = "fake-key"

        # Setup mock client response
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client

        mock_response = MagicMock()
        mock_response.data = [{"id": "123", "name": "Test Customer"}]

        # Chain calls: client.table().select().eq().execute()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

        # Execute
        result = query_customer("123")

        # Verify
        self.assertEqual(result, {"id": "123", "name": "Test Customer"})
        mock_client.table.assert_called_with("customers")
        mock_client.table().select.assert_called_with("*")
        mock_client.table().select().eq.assert_called_with("id", "123")

    @patch('tools.supabase_tool.Config')
    @patch('tools.supabase_tool.create_client')
    def test_query_customer_not_found(self, mock_create_client, mock_config):
        # Setup mock config
        mock_config.SUPABASE_URL = "http://fake-url.com"
        mock_config.SUPABASE_KEY = "fake-key"

        # Setup mock client response
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client

        mock_response = MagicMock()
        mock_response.data = [] # Empty list

        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

        # Execute
        result = query_customer("999")

        # Verify
        self.assertIsNone(result)

    @patch('tools.supabase_tool.Config')
    def test_query_customer_no_config(self, mock_config):
        # Setup mock config to return None
        mock_config.SUPABASE_URL = None
        mock_config.SUPABASE_KEY = None

        # Reset the global supabase client
        tools.supabase_tool.supabase = None

        result = query_customer("123")

        self.assertEqual(result, {"error": "Supabase client not initialized. Check environment variables."})

if __name__ == '__main__':
    unittest.main()
