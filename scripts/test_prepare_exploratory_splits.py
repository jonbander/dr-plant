import csv
import io
import json
import runpy
import sys
import tempfile
import unittest
import contextlib
from pathlib import Path


SCRIPT = Path(__file__).with_name("prepare_exploratory_splits.py")


def run_script(manifest, out, expect_error=False):
    old_argv = sys.argv
    sys.argv = ["prepare_exploratory_splits.py", str(manifest), "--out", str(out)]
    try:
        if expect_error:
            with contextlib.redirect_stderr(io.StringIO()):
                with unittest.TestCase().assertRaises(SystemExit):
                    runpy.run_path(str(SCRIPT), run_name="__main__")
        else:
            with contextlib.redirect_stdout(io.StringIO()):
                runpy.run_path(str(SCRIPT), run_name="__main__")
    finally:
        sys.argv = old_argv


def write_manifest(path, rows):
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


class ExploratorySplitTests(unittest.TestCase):
    def test_exact_duplicates_stay_together_and_report_warns(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manifest, out = root / "manifest.csv", root / "out"
            rows = []
            for label, prefix in (("healthy", "a"), ("scab", "b")):
                for index in range(10):
                    rows.append({
                        "relative_path": f"{label}/{index}.jpg",
                        "sha256": (prefix + f"{index:063x}")[-64:],
                        "class_label": label,
                    })
            rows.append(dict(rows[0], relative_path="healthy/duplicate.jpg"))
            write_manifest(manifest, rows)
            run_script(manifest, out)

            with (out / "exploratory-splits.csv").open() as handle:
                split_rows = list(csv.DictReader(handle))
            duplicate_splits = {
                row["split"] for row in split_rows
                if row["sha256"] == rows[0]["sha256"]
            }
            self.assertEqual(len(duplicate_splits), 1)
            report = json.loads((out / "exploratory-split-report.json").read_text())
            self.assertFalse(report["independent_by_site_plant_session"])
            self.assertEqual(report["quarantined_conflicting_label_images"], 0)

    def test_conflicting_label_hash_group_is_quarantined_not_split(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manifest, out = root / "manifest.csv", root / "out"
            rows = []
            for label, prefix in (("healthy_leaf", "a"), ("sooty_mould", "b")):
                for index in range(5):
                    rows.append({
                        "relative_path": f"{label}/{index:06d}.jpg",
                        "sha256": (prefix + f"{index:063x}")[-64:],
                        "class_label": label,
                    })
            conflict_sha = "c" * 64
            rows.extend([
                {"relative_path": "healthy_leaf/000072.jpg", "sha256": conflict_sha,
                 "class_label": "healthy_leaf"},
                {"relative_path": "sooty_mould/000059.jpg", "sha256": conflict_sha,
                 "class_label": "sooty_mould"},
            ])
            write_manifest(manifest, rows)
            run_script(manifest, out)

            with (out / "exploratory-splits.csv").open() as handle:
                split_rows = list(csv.DictReader(handle))
            self.assertNotIn(conflict_sha, {row["sha256"] for row in split_rows})
            with (out / "quarantined-conflicting-label-duplicates.csv").open() as handle:
                quarantined = list(csv.DictReader(handle))
            self.assertEqual(
                {row["relative_path"] for row in quarantined},
                {"healthy_leaf/000072.jpg", "sooty_mould/000059.jpg"},
            )
            report = json.loads((out / "exploratory-split-report.json").read_text())
            self.assertEqual(report["quarantined_conflicting_label_images"], 2)
            self.assertEqual(report["quarantined_conflicting_hash_groups"], 1)
            self.assertEqual(report["images_in_splits"], 10)

    def test_rejects_too_few_unique_images_per_class_after_quarantine(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manifest, out = root / "manifest.csv", root / "out"
            rows = [
                {"relative_path": f"{label}/{index}.jpg",
                 "sha256": (prefix + f"{index:063x}")[-64:],
                 "class_label": label}
                for label, prefix in (("healthy", "a"), ("scab", "b"))
                for index in range(2)
            ]
            write_manifest(manifest, rows)
            run_script(manifest, out, expect_error=True)
            report = json.loads((out / "exploratory-split-report.json").read_text())
            self.assertEqual(
                report["status"],
                "blocked_insufficient_unique_images_after_quarantine",
            )
            self.assertFalse((out / "exploratory-splits.csv").exists())


if __name__ == "__main__":
    unittest.main()
