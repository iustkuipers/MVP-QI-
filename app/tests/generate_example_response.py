import json
from pathlib import Path

from app.services.backtest_engine import run_backtest


FIXTURE_DIR = Path(__file__).parent / "fixtures"
REQUEST_FILE = FIXTURE_DIR / "example_request.json"
OUTPUT_FILE = FIXTURE_DIR / "example_response.json"


def main():
    with open(REQUEST_FILE, "r") as f:
        request_data = json.load(f)

    result = run_backtest(request_data)

    # Pretty-print for frontend readability
    with open(OUTPUT_FILE, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Example response written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
