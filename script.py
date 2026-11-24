"""Serve the LiveCycle static application on localhost for development."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Inicia el servidor local de LiveCycle.")
    parser.add_argument("--port", type=int, default=8000, help="Puerto HTTP (por defecto: 8000).")
    args = parser.parse_args()

    project_dir = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(project_dir))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"LiveCycle disponible en http://127.0.0.1:{args.port}")
        print("Presiona Ctrl+C para detener el servidor.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")


if __name__ == "__main__":
    main()