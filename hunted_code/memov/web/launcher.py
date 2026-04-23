"""Launcher for background web server.

This module is called by UIManager to start the server in a background process.
"""

import argparse
import sys

from memov.web.server import start_server


def main():
    """Entry point for background server launch."""
    parser = argparse.ArgumentParser(description="MemoV Web UI Launcher")
    parser.add_argument("project_path", help="Path to the project directory")
    parser.add_argument("--port", type=int, default=38888, help="Port to listen on")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")

    args = parser.parse_args()

    # Start the server (this blocks until server stops)
    start_server(args.project_path, port=args.port, host=args.host)


if __name__ == "__main__":
    main()
