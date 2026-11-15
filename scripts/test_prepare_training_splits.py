import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("prepare_training_splits.py")
SPEC = importlib.util.spec_from_file_location("prepare_training_splits", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def row(name, group, label, digest):
    return {
        "relative_path": name,
        "sha256": (digest + "0" * 64)[:64],
        "pairing_status": "paired",
        "xml_parse_ok": "yes",
        "labels": label,
        "provenance_verified": "yes",
        "expert_label_review": "yes",
        "near_duplicate_review": "yes",
        "group_id_for_split": group,
        "split": "",
    }


class TrainingSplitTests(unittest.TestCase):
    def fixture_rows(self):
        rows = []
        for label, prefix in (("powdery", "p"), ("downy", "d"), ("healthy", "h")):
            for index in range(6):
                rows.append(row(f"{prefix}{index}.jpg", f"{prefix}-site-{index}", label, f"{ord(prefix):02x}{index + 1:02x}"))
        return rows

    def test_split_is_group_isolated_and_class_complete(self):
        rows = self.fixture_rows()
        groups = MODULE.validate_rows(rows)
        assignment = MODULE.make_assignment(rows, groups, 42)
        self.assertEqual(set(assignment.values()), set(MODULE.SPLITS))
        for label in ("powdery", "downy", "healthy"):
            for split in MODULE.SPLITS:
                self.assertTrue(any(assignment[group] == split and label in labels for group, labels in groups.items()))
        self.assertEqual(len(assignment), len(set(assignment)))

    def test_assignment_is_reproducible(self):
        rows = self.fixture_rows()
        groups = MODULE.validate_rows(rows)
        self.assertEqual(
            MODULE.make_assignment(rows, groups, 7),
            MODULE.make_assignment(rows, groups, 7),
        )

    def test_rejects_unverified_provenance(self):
        rows = self.fixture_rows()
        rows[0]["provenance_verified"] = "no"
        with self.assertRaises(MODULE.ReadinessError):
            MODULE.validate_rows(rows)

    def test_rejects_unreviewed_labels(self):
        rows = self.fixture_rows()
        rows[0]["expert_label_review"] = "no"
        with self.assertRaises(MODULE.ReadinessError):
            MODULE.validate_rows(rows)

    def test_rejects_incomplete_near_duplicate_review(self):
        rows = self.fixture_rows()
        rows[0]["near_duplicate_review"] = "no"
        with self.assertRaises(MODULE.ReadinessError):
            MODULE.validate_rows(rows)

    def test_rejects_exact_duplicates(self):
        rows = self.fixture_rows()
        rows[1]["sha256"] = rows[0]["sha256"]
        with self.assertRaises(MODULE.ReadinessError):
            MODULE.validate_rows(rows)

    def test_rejects_classes_with_too_few_independent_groups(self):
        rows = self.fixture_rows()
        rows = [r for r in rows if r["relative_path"] not in {"p2.jpg", "p3.jpg", "p4.jpg", "p5.jpg"}]
        with self.assertRaises(MODULE.ReadinessError):
            MODULE.validate_rows(rows)

    def test_writes_manifest_and_report_without_copying_images(self):
        rows = self.fixture_rows()
        groups = MODULE.validate_rows(rows)
        assignment = MODULE.make_assignment(rows, groups, 42)
        with tempfile.TemporaryDirectory() as directory:
            report = MODULE.write_outputs(rows, assignment, Path(directory), 42)
            self.assertEqual(report["status"], "split_manifest_created_not_training")
            self.assertTrue((Path(directory) / "training-splits.csv").is_file())
            self.assertTrue((Path(directory) / "training-split-report.json").is_file())
            self.assertFalse(report["images_copied"])
            self.assertFalse(report["model_trained"])


if __name__ == "__main__":
    unittest.main()
