import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("research") / "audit_grape_morphology_v1.py"
SPEC = importlib.util.spec_from_file_location("audit_grape_morphology_v1", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def make_rows():
    rows = []
    for split, suffix in (("train", "a"), ("val", "b"), ("test", "c")):
        for index, label in enumerate(("Healthy", "Mites")):
            rows.append({
                "relative_path": f"{split}/{suffix}{index}.jpg",
                "source_sha256": f"{suffix}{index}".ljust(64, "0"),
                "class_label": label,
                "split": split,
                "group_id": f"{suffix}-group-{index}",
                "source_license": "CC BY 4.0",
                "source_dataset": "fixture",
            })
    return rows


class MorphologyManifestAuditTests(unittest.TestCase):
    def test_near_duplicate_only_is_not_field_independent(self):
        report = MODULE.audit_rows(make_rows())
        self.assertEqual(report["status"], "near_duplicate_only_not_field_independent")
        self.assertFalse(report["claims_allowed"]["field_independent_evaluation"])

    def test_detects_exact_hash_leakage(self):
        rows = make_rows()
        rows[0]["source_sha256"] = rows[2]["source_sha256"]
        report = MODULE.audit_rows(rows)
        self.assertEqual(report["exact_hash_cross_split_leakage_count"], 1)
        self.assertEqual(report["status"], "blocked")

    def test_detects_group_id_leakage(self):
        rows = make_rows()
        rows[0]["group_id"] = rows[2]["group_id"]
        report = MODULE.audit_rows(rows)
        self.assertEqual(report["group_id_cross_split_leakage_count"], 1)
        self.assertEqual(report["status"], "blocked")

    def test_detects_plant_farm_session_leakage(self):
        rows = make_rows()
        for row in rows:
            row.update({"plant_id": "vine-1", "farm_id": "farm-1", "session_id": row["split"]})
        report = MODULE.audit_rows(rows)
        self.assertIn("plant_id", report["identity_cross_split_leakage"])
        self.assertIn("farm_id", report["identity_cross_split_leakage"])
        self.assertEqual(report["status"], "blocked")

    def test_accepts_complete_field_group_id(self):
        rows = make_rows()
        for index, row in enumerate(rows):
            row["field_group_id"] = f"field-group-{index}"
        report = MODULE.audit_rows(rows, require_field_independent=True)
        self.assertEqual(report["status"], "field_grouped_manifest_audited")
        self.assertTrue(report["claims_allowed"]["field_independent_evaluation"])

    def test_strict_mode_blocks_missing_field_ids(self):
        report = MODULE.audit_rows(make_rows(), require_field_independent=True)
        self.assertEqual(report["status"], "blocked")
        self.assertIn("field_independent_split_required_but_field_identity_incomplete", report["errors"])

    def test_expert_labels_and_manual_masks_are_explicit_gates(self):
        rows = make_rows()
        for row in rows:
            row.update({"label_status": "expert_confirmed", "reviewer_id": "reviewer-01", "leaf_mask_path": "masks/x.png"})
        report = MODULE.audit_rows(rows, require_expert_labels=True, require_manual_masks=True)
        self.assertTrue(report["claims_allowed"]["expert_confirmed_labels"])
        self.assertTrue(report["claims_allowed"]["manual_leaf_segmentation"])


if __name__ == "__main__":
    unittest.main()
