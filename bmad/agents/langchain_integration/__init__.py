"""LangChain integration package (underscore variant for Python imports).

This mirrors the files in `langchain-integration` but uses an import-safe
directory name so tests can import `agents.langchain_integration`.

By default, this package is archived (LangChain prototypes are paused).
To enable, set `ENABLE_AI_PROTOTYPES=true` in the environment.
"""
import os
if os.environ.get('ENABLE_AI_PROTOTYPES', 'false').lower() != 'true':
	raise RuntimeError('LangChain prototypes are archived. Set ENABLE_AI_PROTOTYPES=true to import this package')

__all__ = []
