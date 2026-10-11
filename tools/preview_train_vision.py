#!/usr/bin/env python3
"""Run the Rhino/AWT LCD preview from any working directory."""
import argparse
import os
import sys
from pathlib import Path
import shutil
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description="Generate Train Vision LCD PNG previews using Rhino 1.7.15.")
    parser.add_argument("output", nargs="?", type=Path,
                        default=Path(tempfile.gettempdir()) / "train-vision-preview")
    parser.add_argument("--font", type=Path, help="Optional CJK .ttf font file")
    parser.add_argument("--no-open", action="store_true", help="Generate PNG files without opening the preview")
    args = parser.parse_args()
    project = Path(__file__).resolve().parent.parent
    jar = project / "tools/rhino/rhino-1.7.15.jar"
    java = shutil.which("java")
    if not java:
        parser.error("Java was not found; install a JRE/JDK and put java on PATH.")
    if not jar.is_file():
        parser.error(f"Rhino JAR was not found: {jar}")
    font = args.font.expanduser().resolve() if args.font else None
    if font and not font.is_file():
        parser.error(f"Font file was not found: {font}")
    if font is None:
        candidates = [Path("/Library/Fonts/NotoSansCJKsc-VF.ttf"),
                      Path("/Library/Fonts/Arial Unicode.ttf"),
                      Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
                      Path("C:/Windows/Fonts/msyh.ttf"),
                      Path("/usr/share/fonts/truetype/arphic/uming.ttf")]
        font = next((p for p in candidates if p.is_file()), None)
    output = args.output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    command = [java, "-Djava.awt.headless=true", "-cp", str(jar),
               "org.mozilla.javascript.tools.shell.Main", "-version", "200",
               str(project / "tests/train_vision.preview.js"),
               str(project / "assets/jsblock/scripts/train_vision"), str(output)]
    if font:
        command.append(str(font))
    print(f"Output: {output}", flush=True)
    print(f"Font: {font or 'Java system font (use --font if CJK glyphs are missing)'}", flush=True)
    result = subprocess.run(command, cwd=project)
    if result.returncode:
        return result.returncode
    preview = output / "preview.png"
    if not preview.is_file():
        parser.error("Rhino finished without generating preview.png; see its output above.")
    print(f"Preview: {preview}", flush=True)
    if not args.no_open:
        try:
            if sys.platform == "win32":
                os.startfile(str(preview))
            else:
                opener = shutil.which("open" if sys.platform == "darwin" else "xdg-open")
                if not opener:
                    raise OSError("No desktop image opener found")
                opened = subprocess.run([opener, str(preview)], check=False)
                if opened.returncode:
                    raise OSError(f"Image opener exited with status {opened.returncode}")
        except OSError as error:
            print(f"PNG files were generated; open {preview} manually. ({error})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
