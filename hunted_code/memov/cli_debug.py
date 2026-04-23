#!/usr/bin/env python3
"""
CLI tool for VIBE debugging - RAG-based code debugging with multi-model LLM comparison.

This standalone CLI tool allows you to:
1. Search code history using RAG (semantic search)
2. Debug issues using multiple LLM models
3. Compare responses from different AI models
4. Get actionable recommendations

Usage:
    mem-debug search "authentication logic"
    mem-debug analyze "Why is login failing?" --error "User not found"
    mem-debug compare "How to fix memory leak?" --models gpt-4o,claude-3-5-sonnet-20241022
"""

import logging
import os
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from memov.core.manager import MemovManager, MemStatus
from memov.debugging.llm_client import LLMClient
from memov.debugging.rag_debugger import RAGDebugger

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Rich console for pretty output
console = Console()

# Typer app
app = typer.Typer(
    name="mem-debug",
    help="VIBE Debugging - RAG-based code debugging with multi-model LLM comparison",
    add_completion=False,
)


def get_project_path() -> str:
    """Get project path from environment or current directory."""
    project_path = os.getenv("MEMOV_PROJECT_PATH", os.getcwd())
    return project_path


def check_setup(project_path: str) -> tuple[bool, str]:
    """
    Check if Memov is properly set up.

    Returns:
        Tuple of (success, error_message)
    """
    try:
        manager = MemovManager(project_path=project_path)

        # Check if initialized
        status = manager.check()
        if status != MemStatus.SUCCESS:
            return False, f"Memov not initialized. Run 'mem init' in your project directory."

        # Check if VectorDB has data
        db_info = manager.get_vectordb_info()
        if db_info.get("count", 0) == 0:
            return False, f"VectorDB is empty. Run 'mem sync' to populate the database."

        return True, ""

    except Exception as e:
        return False, f"Error: {str(e)}"


@app.command()
def search(
    query: str = typer.Argument(..., help="Search query"),
    n_results: int = typer.Option(5, "--limit", "-n", help="Number of results"),
    content_type: str = typer.Option("", "--type", "-t", help="Filter by type: prompt, response, agent_plan"),
    project_path: Optional[str] = typer.Option(None, "--path", "-p", help="Project path (default: current dir)"),
):
    """
    Search code history using RAG (semantic search).

    Examples:
        mem-debug search "authentication implementation"
        mem-debug search "API error handling" --limit 10
        mem-debug search "database setup" --type agent_plan
    """
    path = project_path or get_project_path()

    # Check setup
    success, error = check_setup(path)
    if not success:
        console.print(f"[red]✗ {error}[/red]")
        raise typer.Exit(1)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task(description="Searching...", total=None)

        try:
            manager = MemovManager(project_path=path)
            debugger = RAGDebugger(manager, llm_client=None)

            # Search
            content_types = [content_type] if content_type else ["prompt", "response", "agent_plan"]
            results = debugger.search_relevant_code(
                query=query,
                n_results=n_results,
                content_types=content_types,
            )

        except Exception as e:
            console.print(f"[red]✗ Error: {str(e)}[/red]")
            raise typer.Exit(1)

    # Display results
    console.print(Panel(f"🔍 Search: {query}", style="bold blue"))
    console.print(f"\nFound [bold]{len(results)}[/bold] results\n")

    for i, result in enumerate(results, 1):
        metadata = result.get("metadata", {})
        text = result.get("text", "")
        distance = result.get("distance", 1.0)
        relevance = (1.0 - distance) * 100

        commit = metadata.get("commit_hash", "unknown")[:8]
        ctype = metadata.get("content_type", "unknown")
        files = metadata.get("files", "")
        operation = metadata.get("operation_type", "unknown")

        # Create result table
        table = Table(show_header=False, box=None, padding=(0, 1))
        table.add_column("Key", style="cyan")
        table.add_column("Value")

        table.add_row("Relevance", f"{relevance:.1f}%")
        table.add_row("Commit", commit)
        table.add_row("Type", ctype)
        table.add_row("Operation", operation)

        if files:
            files_list = [f.strip() for f in files.split(",") if f.strip()]
            table.add_row("Files", ", ".join(files_list[:3]))

        console.print(Panel(table, title=f"[bold]Result {i}[/bold]", border_style="green"))

        # Show content preview
        preview = text[:300] + "..." if len(text) > 300 else text
        console.print(f"  [dim]{preview}[/dim]\n")


@app.command()
def analyze(
    query: str = typer.Argument(..., help="Debug question or issue description"),
    error: Optional[str] = typer.Option(None, "--error", "-e", help="Error message"),
    trace: Optional[str] = typer.Option(None, "--trace", "-t", help="Stack trace"),
    logs: Optional[str] = typer.Option(None, "--logs", "-l", help="User logs"),
    models: Optional[str] = typer.Option(None, "--models", "-m", help="Comma-separated model names"),
    n_results: int = typer.Option(5, "--context", "-c", help="Number of context snippets"),
    project_path: Optional[str] = typer.Option(None, "--path", "-p", help="Project path"),
):
    """
    Analyze and debug issues using RAG + multi-model LLM comparison.

    Examples:
        mem-debug analyze "Why is the API slow?"
        mem-debug analyze "Login fails" --error "Invalid credentials"
        mem-debug analyze "Memory leak" --models "gpt-4o,claude-3-5-sonnet-20241022"
    """
    path = project_path or get_project_path()

    # Check setup
    success, error_msg = check_setup(path)
    if not success:
        console.print(f"[red]✗ {error_msg}[/red]")
        raise typer.Exit(1)

    # Check API keys
    api_keys = LLMClient.setup_api_keys()
    available_providers = [k for k, v in api_keys.items() if v]

    if not available_providers:
        console.print("[red]✗ No API keys configured![/red]")
        console.print("\nPlease set at least one API key:")
        console.print("  export OPENAI_API_KEY=your_key")
        console.print("  export ANTHROPIC_API_KEY=your_key")
        console.print("  export GEMINI_API_KEY=your_key")
        raise typer.Exit(1)

    console.print(Panel(f"🔍 Analyzing: {query}", style="bold blue"))
    console.print(f"Available providers: {', '.join(available_providers)}\n")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task1 = progress.add_task("[cyan]Building context with RAG...", total=None)

        try:
            manager = MemovManager(project_path=path)

            # Parse models
            model_list = None
            if models:
                model_list = [m.strip() for m in models.split(",") if m.strip()]
                console.print(f"Using models: {', '.join(model_list)}\n")

            llm_client = LLMClient(models=model_list) if model_list else LLMClient()
            debugger = RAGDebugger(manager, llm_client)

            # Build context
            context = debugger.build_debug_context(
                query=query,
                error_message=error,
                stack_trace=trace,
                user_logs=logs,
                n_results=n_results,
            )

            progress.update(task1, description="[cyan]Context built ✓")

            task2 = progress.add_task(
                f"[yellow]Querying {len(llm_client.models)} LLM models...",
                total=None
            )

            # Query LLMs
            result = debugger.debug_with_llm(
                query=query,
                context=context,
                models=model_list,
                use_async=True,
            )

            progress.update(task2, description=f"[yellow]Queries complete ✓")

        except Exception as e:
            console.print(f"\n[red]✗ Error: {str(e)}[/red]")
            raise typer.Exit(1)

    # Display results
    console.print("\n" + "=" * 80 + "\n")
    console.print(Panel("📊 DEBUGGING ANALYSIS", style="bold green"))

    # Context summary
    console.print("\n[bold]Context Retrieved:[/bold]")
    console.print(f"  • Relevant commits: {len(context.relevant_commits or [])}")
    if context.error_message:
        console.print(f"  • Error: {context.error_message[:100]}")

    # Recommendations
    if result.recommendations:
        console.print("\n[bold]🎯 Key Recommendations:[/bold]")
        for i, rec in enumerate(result.recommendations[:5], 1):
            console.print(f"  {i}. {rec}")

    # Model responses
    console.print("\n[bold]💬 Analysis by Model:[/bold]\n")

    for resp in result.llm_responses:
        model = resp.get("model", "Unknown")
        content = resp.get("content")
        error_resp = resp.get("error")
        tokens = resp.get("tokens")

        if error_resp:
            console.print(Panel(
                f"[red]Error: {error_resp}[/red]",
                title=f"[red]✗ {model}[/red]",
                border_style="red",
            ))
        elif content:
            # Render as markdown
            md = Markdown(content)
            console.print(Panel(
                md,
                title=f"[green]✓ {model}[/green]",
                border_style="green",
            ))

            if tokens:
                console.print(f"  [dim]Tokens: {tokens.get('total', 0)} "
                             f"(prompt: {tokens.get('prompt', 0)}, "
                             f"completion: {tokens.get('completion', 0)})[/dim]\n")
        else:
            console.print(Panel(
                "[yellow]No response[/yellow]",
                title=f"[yellow]⚠ {model}[/yellow]",
                border_style="yellow",
            ))

    console.print("\n" + "=" * 80)


@app.command()
def compare(
    query: str = typer.Argument(..., help="Question to ask all models"),
    models: str = typer.Option(
        "gpt-4o-mini,claude-3-5-sonnet-20241022,gemini/gemini-1.5-flash",
        "--models",
        "-m",
        help="Comma-separated model names",
    ),
    project_path: Optional[str] = typer.Option(None, "--path", "-p", help="Project path"),
):
    """
    Compare responses from multiple LLM models side-by-side.

    This command queries multiple models with the same question and displays
    responses for comparison. Useful for getting diverse perspectives.

    Examples:
        mem-debug compare "How to optimize database queries?"
        mem-debug compare "Best practices for error handling" --models gpt-4o,claude-3-opus-20240229
    """
    path = project_path or get_project_path()

    # Parse models
    model_list = [m.strip() for m in models.split(",") if m.strip()]

    console.print(Panel(f"🔄 Comparing {len(model_list)} models", style="bold blue"))
    console.print(f"Models: {', '.join(model_list)}\n")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task(description="Querying models...", total=None)

        try:
            llm_client = LLMClient(models=model_list)

            responses = llm_client.query_multiple(
                prompt=query,
                system_prompt="You are a helpful coding assistant. Provide concise, actionable answers.",
            )

        except Exception as e:
            console.print(f"\n[red]✗ Error: {str(e)}[/red]")
            raise typer.Exit(1)

    # Display comparison
    console.print("\n" + "=" * 80 + "\n")

    for i, resp in enumerate(responses, 1):
        model = resp.get("model", "Unknown")
        content = resp.get("content")
        error = resp.get("error")

        if error:
            console.print(Panel(
                f"[red]Error: {error}[/red]",
                title=f"[{i}] {model}",
                border_style="red",
            ))
        elif content:
            md = Markdown(content)
            console.print(Panel(
                md,
                title=f"[{i}] {model}",
                border_style="green",
            ))
        else:
            console.print(Panel(
                "[yellow]No response[/yellow]",
                title=f"[{i}] {model}",
                border_style="yellow",
            ))

        console.print()


@app.command()
def setup():
    """
    Check setup status and display configuration instructions.
    """
    console.print(Panel("🔧 VIBE Debugging Setup Check", style="bold blue"))

    # Check project
    path = get_project_path()
    console.print(f"\n[bold]Project Path:[/bold] {path}")

    success, error = check_setup(path)

    if success:
        console.print("[green]✓ Memov initialized[/green]")

        manager = MemovManager(project_path=path)
        db_info = manager.get_vectordb_info()
        console.print(f"[green]✓ VectorDB populated ({db_info.get('count', 0)} documents)[/green]")
    else:
        console.print(f"[red]✗ {error}[/red]")

    # Check LiteLLM
    try:
        import litellm
        console.print("[green]✓ LiteLLM installed[/green]")
    except ImportError:
        console.print("[red]✗ LiteLLM not installed[/red]")
        console.print("  Install: pip install litellm")

    # Check API keys
    console.print("\n[bold]API Keys:[/bold]")
    api_keys = LLMClient.setup_api_keys()

    for provider, available in api_keys.items():
        status = "[green]✓[/green]" if available else "[red]✗[/red]"
        console.print(f"  {status} {provider.upper()}")

    if not any(api_keys.values()):
        console.print("\n[yellow]No API keys configured. Set at least one:[/yellow]")
        console.print("  export OPENAI_API_KEY=your_key")
        console.print("  export ANTHROPIC_API_KEY=your_key")
        console.print("  export GEMINI_API_KEY=your_key")

    # Available models
    console.print("\n[bold]Available Models:[/bold]")
    models = LLMClient.get_available_models()

    for provider, model_list in models.items():
        if api_keys.get(provider):
            console.print(f"\n[green]{provider.upper()}:[/green]")
            for model in model_list[:3]:
                console.print(f"  • {model}")


def main():
    """Main entry point."""
    app()


if __name__ == "__main__":
    main()
