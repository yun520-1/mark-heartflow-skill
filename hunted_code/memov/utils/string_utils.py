def short_msg(val: str) -> str:
    """Shorten the message to 15 characters, adding '...' if longer."""
    if not isinstance(val, str):
        raise TypeError(f"Expected str, got {type(val)}")

    if not val:
        return ""
    return val[:15] + ("..." if len(val) > 15 else "")


def clean_windows_git_lstree_output(output: str) -> str:
    """Clean up git ls-tree output for Windows compatibility.

    Handles:
    - Windows CRLF line endings (\\r\\n)
    - Quoted paths (git quotes paths with special characters)
    - Trailing/leading whitespace
    - Any stray carriage return or newline characters
    """
    if not isinstance(output, str):
        raise TypeError(f"Expected str, got {type(output)}")

    # Remove ALL carriage return and newline characters (not just at the end)
    # This handles cases where git output may have embedded control characters
    result = output.replace('\r', '').replace('\n', '')
    # Strip whitespace and remove quotes
    result = result.strip().strip('"')
    return result


def normalize_path_separator(path: str) -> str:
    """Normalize path separators to forward slashes for git compatibility.

    Git always uses forward slashes ('/') for paths, but on Windows,
    os.path functions return backslashes ('\\').
    This function converts all backslashes to forward slashes.

    Args:
        path: A file path (may use '/' or '\\' as separator)

    Returns:
        Path with all separators normalized to forward slashes
    """
    return path.replace("\\", "/")


def split_path_parts(rel_path: str) -> list[str]:
    """Split a relative path into parts, handling both Unix and Windows separators.

    This function normalizes path separators to work cross-platform.
    Git always outputs paths with '/' but os.path.relpath uses '\\' on Windows.

    Args:
        rel_path: A relative file path (may use '/' or '\\' as separator)

    Returns:
        List of path components
    """
    # Normalize to forward slashes then split
    # This handles both Git output (/) and Windows os.path output (\\)
    return normalize_path_separator(rel_path).split("/")
