from pathlib import Path
import sys

from flask import Flask, render_template


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder=str(PROJECT_ROOT / "frontend" / "templates"),
        static_folder=str(PROJECT_ROOT / "frontend" / "static"),
    )

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    return app


app = create_app()


if __name__ == "__main__":
    try:
        port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    except ValueError:
        raise SystemExit("Port must be an integer.")

    app.run(host="0.0.0.0", port=port, debug=True)
