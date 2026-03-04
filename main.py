import webbrowser
from pathlib import Path


def main():
    output_dir = Path(__file__).parent / "output"
    index_path = output_dir / "index.html"

    if not index_path.exists():
        print(f"Error: {index_path} not found.")
        return

    url = index_path.as_uri()
    print(f"Opening MedScribe prototype: {url}")
    webbrowser.open(url)


if __name__ == "__main__":
    main()
