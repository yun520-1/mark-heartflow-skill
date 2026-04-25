"""
LiteLLM client for multi-model LLM querying.

This module provides a unified interface to query multiple LLM models
using LiteLLM, supporting OpenAI, Anthropic, Google, and other providers.
"""

import asyncio
import logging
import os
from typing import Any, Dict, List, Optional

try:
    import litellm
    from litellm import acompletion, completion
    LITELLM_AVAILABLE = True
except ImportError:
    LITELLM_AVAILABLE = False

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for querying multiple LLM models via LiteLLM."""

    # Default model configurations
    DEFAULT_MODELS = [
        "gpt-4o-mini",           # OpenAI
        "claude-3-5-sonnet-20241022",  # Anthropic
        "gemini/gemini-1.5-flash",     # Google
    ]

    def __init__(
        self,
        models: Optional[List[str]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        timeout: int = 60,
    ):
        """
        Initialize the LLM client.

        Args:
            models: List of model names to query (default: DEFAULT_MODELS)
            temperature: Temperature for generation (0.0-1.0)
            max_tokens: Maximum tokens to generate
            timeout: Request timeout in seconds
        """
        if not LITELLM_AVAILABLE:
            raise ImportError(
                "litellm is required for multi-model querying. "
                "Install with: pip install litellm"
            )

        self.models = models or self.DEFAULT_MODELS
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout

        # Set LiteLLM configuration
        litellm.drop_params = True  # Drop unsupported params instead of erroring
        litellm.telemetry = False   # Disable telemetry

        logger.info(f"Initialized LLMClient with models: {self.models}")

    def query_single(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Query a single LLM model.

        Args:
            model: Model name (e.g., "gpt-4o-mini")
            prompt: User prompt
            system_prompt: Optional system prompt
            **kwargs: Additional parameters for litellm.completion

        Returns:
            Response dictionary with keys:
                - model: Model name
                - content: Response content
                - tokens: Token usage info
                - error: Error message if failed
        """
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = completion(
                model=model,
                messages=messages,
                temperature=kwargs.get("temperature", self.temperature),
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                timeout=kwargs.get("timeout", self.timeout),
            )

            return {
                "model": model,
                "content": response.choices[0].message.content,
                "tokens": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens,
                },
                "error": None,
            }

        except Exception as e:
            logger.error(f"Error querying model {model}: {e}")
            return {
                "model": model,
                "content": None,
                "tokens": None,
                "error": str(e),
            }

    async def query_single_async(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Async version of query_single.

        Args:
            model: Model name
            prompt: User prompt
            system_prompt: Optional system prompt
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = await acompletion(
                model=model,
                messages=messages,
                temperature=kwargs.get("temperature", self.temperature),
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                timeout=kwargs.get("timeout", self.timeout),
            )

            return {
                "model": model,
                "content": response.choices[0].message.content,
                "tokens": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens,
                },
                "error": None,
            }

        except Exception as e:
            logger.error(f"Error querying model {model}: {e}")
            return {
                "model": model,
                "content": None,
                "tokens": None,
                "error": str(e),
            }

    def query_multiple(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        models: Optional[List[str]] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Query multiple models sequentially.

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            models: List of model names (default: self.models)
            **kwargs: Additional parameters

        Returns:
            List of response dictionaries
        """
        target_models = models or self.models
        results = []

        for model in target_models:
            result = self.query_single(model, prompt, system_prompt, **kwargs)
            results.append(result)

        return results

    async def query_multiple_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        models: Optional[List[str]] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Query multiple models in parallel (async).

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            models: List of model names (default: self.models)
            **kwargs: Additional parameters

        Returns:
            List of response dictionaries
        """
        target_models = models or self.models

        # Create tasks for all models
        tasks = [
            self.query_single_async(model, prompt, system_prompt, **kwargs)
            for model in target_models
        ]

        # Execute in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        formatted_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                formatted_results.append({
                    "model": target_models[i],
                    "content": None,
                    "tokens": None,
                    "error": str(result),
                })
            else:
                formatted_results.append(result)

        return formatted_results

    def compare_responses(
        self,
        responses: List[Dict[str, Any]],
        include_tokens: bool = True
    ) -> str:
        """
        Format multiple LLM responses for comparison.

        Args:
            responses: List of response dictionaries
            include_tokens: Whether to include token usage stats

        Returns:
            Formatted comparison string
        """
        lines = []
        lines.append("=" * 80)
        lines.append("MULTI-MODEL COMPARISON")
        lines.append("=" * 80)
        lines.append("")

        for i, resp in enumerate(responses, 1):
            model = resp.get("model", "Unknown")
            content = resp.get("content")
            error = resp.get("error")
            tokens = resp.get("tokens")

            lines.append(f"[{i}] Model: {model}")
            lines.append("-" * 80)

            if error:
                lines.append(f"❌ Error: {error}")
            elif content:
                lines.append(content)

                if include_tokens and tokens:
                    lines.append("")
                    lines.append(f"📊 Tokens: {tokens.get('total', 0)} "
                                f"(prompt: {tokens.get('prompt', 0)}, "
                                f"completion: {tokens.get('completion', 0)})")
            else:
                lines.append("⚠️ No response content")

            lines.append("")
            lines.append("=" * 80)
            lines.append("")

        return "\n".join(lines)

    @staticmethod
    def get_available_models() -> Dict[str, List[str]]:
        """
        Get list of available models by provider.

        Returns:
            Dictionary mapping provider names to model lists
        """
        return {
            "openai": [
                "gpt-4o",
                "gpt-4o-mini",
                "gpt-4-turbo",
                "gpt-3.5-turbo",
            ],
            "anthropic": [
                "claude-3-5-sonnet-20241022",
                "claude-3-5-haiku-20241022",
                "claude-3-opus-20240229",
            ],
            "google": [
                "gemini/gemini-1.5-pro",
                "gemini/gemini-1.5-flash",
                "gemini/gemini-pro",
            ],
            "cohere": [
                "command-r-plus",
                "command-r",
            ],
            "mistral": [
                "mistral/mistral-large-latest",
                "mistral/mistral-medium-latest",
            ],
        }

    @staticmethod
    def setup_api_keys() -> Dict[str, bool]:
        """
        Check which API keys are configured.

        Returns:
            Dictionary mapping provider names to availability status
        """
        return {
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "google": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
            "cohere": bool(os.getenv("COHERE_API_KEY")),
            "mistral": bool(os.getenv("MISTRAL_API_KEY")),
        }
