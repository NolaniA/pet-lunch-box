"""Build the public source archive from the maintained ESP32-C3 firmware."""
from argparse import ArgumentParser
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public/downloads/pet-lunch-box-esp32c3-source.zip"
PREFIX = "pet-lunch-box-esp32c3/"
ALLOWED_EXTENSIONS = {".ino", ".h", ".cpp", ".md", ".pem"}


def build_archive():
    files = [ROOT / "LICENSE"]
    files += [ROOT / "firmware" / name for name in ("README.md", "platformio.ini", "requirements.txt")]
    files += [
        file for file in (ROOT / "firmware/esp32c3").iterdir()
        if file.is_file() and file.suffix in ALLOWED_EXTENSIONS and file.name != "secrets.h"
    ]
    buffer = BytesIO()
    with ZipFile(buffer, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for file in sorted(files, key=lambda item: item.relative_to(ROOT).as_posix()):
            info = ZipInfo(PREFIX + file.relative_to(ROOT).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            # Match Git LF text on every host, including Windows checkouts.
            archive.writestr(info, file.read_bytes().replace(b"\r\n", b"\n"))
    return buffer.getvalue()


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if the public archive differs from the current source")
    options = parser.parse_args()
    content = build_archive()
    if options.check:
        if not OUTPUT.exists():
            parser.exit(1, "Firmware source archive is missing. Run python scripts/package_firmware.py\n")
        # Compare files rather than compressed bytes across Python/zlib platforms.
        with ZipFile(BytesIO(content)) as expected, ZipFile(OUTPUT) as actual:
            matches = actual.namelist() == expected.namelist() and all(
                actual.read(name) == expected.read(name) for name in expected.namelist()
            )
        if not matches:
            parser.exit(1, "Firmware source archive is stale. Run python scripts/package_firmware.py\n")
        print("Firmware source archive matches the current source.")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(content)
        print(f"Packaged {OUTPUT.relative_to(ROOT).as_posix()}")
