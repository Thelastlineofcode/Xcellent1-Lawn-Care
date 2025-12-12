"""LangChain integration package (original folder).

This package contains archived prototypes that are disabled by default.
If you need to re-enable these prototype modules, set `ENABLE_AI_PROTOTYPES=true`.
"""
import os
if os.environ.get('ENABLE_AI_PROTOTYPES', 'false').lower() != 'true':
    raise RuntimeError('LangChain prototypes are archived. Set ENABLE_AI_PROTOTYPES=true to import this package')

__all__ = []
