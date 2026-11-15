"""Regression tests for scripts/audit-hermos.py (standard-library only)."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "audit-hermos.py"


def write_xml(path: Path, objects: str, width: str = "100", height: str = "80"):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f'<annotation><size><width>{width}</width><height>{height}</height></size>{objects}</annotation>',
        encoding="utf-8",
    )


class AuditHermosTests(unittest.TestCase):
    def run_audit(self, root: Path, out: Path):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(root), "--out", str(out)],
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads((out / "hermos-audit-report.json").read_text()), result

    def test_reports_object_and_image_counts_separately_and_casefolds_xml(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            root, out = base / "dataset", base / "audit"
            (root / "images").mkdir(parents=True)
            (root / "images" / "leaf.JPG").write_bytes(b"image-one")
            write_xml(
                root / "Annotations" / "LEAF.XML",
                '<object><name>powdery_mildew</name><bndbox><xmin>1</xmin><ymin>2</ymin><xmax>20</xmax><ymax>30</ymax></bndbox></object>'
                '<object><name>powdery_mildew</name><bndbox><xmin>2</xmin><ymin>3</ymin><xmax>21</xmax><ymax>31</ymax></bndbox></object>',
            )

            report, _ = self.run_audit(root, out)

            self.assertEqual(report["image_files"], 1)
            self.assertEqual(report["parsed_objects"], 2)
            self.assertEqual(report["class_object_counts"], {"powdery_mildew": 2})
            self.assertEqual(report["class_image_counts"], {"powdery_mildew": 1})
            self.assertEqual(report["images_with_valid_xml"], 1)
            self.assertEqual(report["valid_bbox_objects"], 2)

    def test_marks_malformed_xml_as_unparseable_not_successfully_paired(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            root, out = base / "dataset", base / "audit"
            root.mkdir()
            (root / "broken.png").write_bytes(b"broken-image")
            (root / "broken.xml").write_text("<annotation>", encoding="utf-8")

            report, _ = self.run_audit(root, out)

            self.assertEqual(report["images_with_valid_xml"], 0)
            self.assertEqual(report["unmatched_or_ambiguous_or_unparseable_images"], ["broken.png"])
            self.assertEqual(len(report["xml_parse_errors"]), 1)

    def test_duplicate_stems_are_ambiguous_and_not_guessed(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            root, out = base / "dataset", base / "audit"
            (root / "one").mkdir(parents=True)
            (root / "two").mkdir(parents=True)
            (root / "one" / "leaf.jpg").write_bytes(b"one")
            (root / "two" / "LEAF.png").write_bytes(b"two")
            write_xml(root / "annotations" / "leaf.xml", "")

            report, _ = self.run_audit(root, out)

            self.assertEqual(
                report["unmatched_or_ambiguous_or_unparseable_images"],
                ["one/leaf.jpg", "two/LEAF.png"],
            )
            self.assertEqual(len(report["orphan_xml_files"]), 1)

    def test_rejects_non_finite_and_out_of_bounds_boxes(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            root, out = base / "dataset", base / "audit"
            root.mkdir()
            (root / "leaf.jpg").write_bytes(b"image")
            write_xml(
                root / "leaf.xml",
                '<object><name>healthy</name><bndbox><xmin>1</xmin><ymin>1</ymin><xmax>NaN</xmax><ymax>10</ymax></bndbox></object>'
                '<object><name>healthy</name><bndbox><xmin>1</xmin><ymin>1</ymin><xmax>101</xmax><ymax>10</ymax></bndbox></object>',
            )

            report, _ = self.run_audit(root, out)

            self.assertEqual(report["parsed_objects"], 2)
            self.assertEqual(report["valid_bbox_objects"], 0)
            self.assertEqual(report["invalid_bbox_count"], 2)

    def test_refuses_output_directory_inside_source_archive(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "dataset"
            root.mkdir()
            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(root), "--out", str(root / "audit")],
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Output directory must be outside", result.stderr)


if __name__ == "__main__":
    unittest.main()
