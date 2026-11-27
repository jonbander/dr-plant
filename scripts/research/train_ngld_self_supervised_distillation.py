#!/usr/bin/env python3
"""Research-only continual representation update for an existing Dr.Plant MobileNetV3-Small.

Uses only the TRAIN split as unlabeled images. The existing checkpoint is a frozen
teacher; a student initialized from exactly the same weights learns two-view
contrastive invariance while distilling the teacher's class outputs. The held-out
test split is evaluated once after training to measure retention, not to claim
field generalization. This script never modifies the teacher checkpoint.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import random
from collections import Counter
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms


REQUIRED = {"relative_path", "class_label", "split", "group_id_for_split", "sha256", "source_dataset_id", "source_version", "source_license", "provenance_verified", "near_duplicate_review"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_rows(manifest: Path, image_root: Path):
    with manifest.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows or not REQUIRED.issubset(rows[0]):
        raise ValueError(f"Manifest must contain: {sorted(REQUIRED)}")
    classes = sorted({r["class_label"].strip() for r in rows})
    if not classes or any(not c for c in classes):
        raise ValueError("Manifest contains an empty class label")
    groups = {s: {r["group_id_for_split"].strip() for r in rows if r["split"] == s} for s in ("train", "validation", "test")}
    if any(not g for g in groups["train"] | groups["validation"] | groups["test"]):
        raise ValueError("Every row must have a real, non-empty group_id_for_split")
    if groups["train"] & groups["validation"] or groups["train"] & groups["test"] or groups["validation"] & groups["test"]:
        raise ValueError("Group leakage across train/validation/test")
    seen_paths, seen_hashes = set(), set()
    valid_splits = {"train", "validation", "test"}
    for r in rows:
        if r["split"] not in valid_splits:
            raise ValueError(f"Invalid split value: {r['split']}")
        rel = Path(r["relative_path"])
        if rel.is_absolute() or ".." in rel.parts:
            raise ValueError(f"Unsafe relative_path: {rel}")
        if r["provenance_verified"].strip().lower() != "yes":
            raise ValueError(f"Unverified image provenance: {rel}")
        if not r["near_duplicate_review"].strip():
            raise ValueError(f"Missing duplicate-review record: {rel}")
        if rel.as_posix() in seen_paths:
            raise ValueError(f"Duplicate manifest path: {rel}")
        seen_paths.add(rel.as_posix())
        if not r["sha256"].strip():
            raise ValueError(f"Missing SHA-256: {rel}")
        if not all(r[k].strip() for k in ("source_dataset_id", "source_version", "source_license")):
            raise ValueError(f"Missing source/license metadata: {rel}")
        if r["sha256"] in seen_hashes:
            raise ValueError(f"Exact duplicate SHA across splits: {rel}")
        seen_hashes.add(r["sha256"])
        full = image_root / rel
        if not full.is_file():
            raise FileNotFoundError(full)
        actual_sha = sha256_file(full)
        if actual_sha.lower() != r["sha256"].strip().lower():
            raise ValueError(f"SHA-256 mismatch for {rel}: manifest={r['sha256']} actual={actual_sha}")
    for split in ("train", "validation", "test"):
        split_classes = {r["class_label"].strip() for r in rows if r["split"] == split}
        if not split_classes:
            raise ValueError(f"Missing {split} split")
        if split_classes != set(classes):
            raise ValueError(f"Every class must occur in {split}; missing={sorted(set(classes)-split_classes)}")
    return rows, classes


class TwoViewImages(Dataset):
    def __init__(self, rows, root, transform):
        self.rows, self.root, self.transform = rows, root, transform

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows[index]
        with Image.open(self.root / row["relative_path"]) as im:
            image = im.convert("RGB")
        return self.transform(image), self.transform(image.copy())


class EvalImages(Dataset):
    def __init__(self, rows, root, transform, class_to_idx):
        self.rows, self.root, self.transform, self.class_to_idx = rows, root, transform, class_to_idx

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows[index]
        with Image.open(self.root / row["relative_path"]) as im:
            x = self.transform(im.convert("RGB"))
        return x, self.class_to_idx[row["class_label"]]


def build_model(num_classes: int):
    model = models.mobilenet_v3_small(weights=None)
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, num_classes)
    return model


def load_model(checkpoint: Path, classes: list[str], device):
    payload = torch.load(checkpoint, map_location="cpu", weights_only=False)
    if payload.get("architecture") != "mobilenet_v3_small":
        raise ValueError("Only the existing MobileNetV3-Small checkpoint is supported by this first experiment")
    if payload.get("classes") != classes:
        raise ValueError("Checkpoint class order differs from manifest; refusing unsafe transfer")
    model = build_model(len(classes))
    model.load_state_dict(payload["state_dict"], strict=True)
    return model.to(device)


def forward_representation_and_logits(model, x):
    features = model.features(x)
    pooled = torch.flatten(model.avgpool(features), 1)
    return pooled, model.classifier(pooled)


def contrastive_loss(z1, z2, temperature: float):
    z = F.normalize(torch.cat([z1, z2], dim=0), dim=1)
    n = z.shape[0]
    similarity = torch.matmul(z, z.T) / temperature
    similarity.fill_diagonal_(-1e9)
    batch = z1.shape[0]
    targets = torch.cat([torch.arange(batch, 2 * batch), torch.arange(0, batch)]).to(z.device)
    return F.cross_entropy(similarity, targets)


def distill_loss(student_logits, teacher_logits, temperature: float):
    return F.kl_div(
        F.log_softmax(student_logits / temperature, dim=1),
        F.softmax(teacher_logits / temperature, dim=1),
        reduction="batchmean",
    ) * (temperature * temperature)


def atomic_torch_save(payload, path: Path):
    tmp = path.with_suffix(path.suffix + ".tmp")
    torch.save(payload, tmp)
    os.replace(tmp, path)


def evaluate(model, loader, device, classes):
    model.eval()
    truth, pred = [], []
    with torch.inference_mode():
        for x, y in loader:
            logits = model(x.to(device))
            pred.extend(logits.argmax(1).cpu().tolist())
            truth.extend(y.tolist())
    return {
        "accuracy": float(accuracy_score(truth, pred)),
        "macro_f1": float(f1_score(truth, pred, average="macro", zero_division=0)),
        "classification_report": classification_report(truth, pred, labels=list(range(len(classes))), target_names=classes, output_dict=True, zero_division=0),
        "confusion_matrix": confusion_matrix(truth, pred).tolist(),
        "samples": len(truth),
    }


import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from training_gate_guard import extract_training_gate_args, enforce_training_gate

def main():
    gate_args=extract_training_gate_args()
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("image_root", type=Path)
    p.add_argument("manifest", type=Path)
    p.add_argument("teacher_checkpoint", type=Path)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--epochs", type=int, default=8)
    p.add_argument("--batch-size", type=int, default=32)
    p.add_argument("--learning-rate", type=float, default=2e-5)
    p.add_argument("--unfreeze-last-blocks", type=int, default=2)
    p.add_argument("--contrastive-weight", type=float, default=0.15)
    p.add_argument("--distillation-weight", type=float, default=1.0)
    p.add_argument("--temperature", type=float, default=2.0)
    p.add_argument("--image-size", type=int, default=160)
    p.add_argument("--seed", type=int, default=42)
    a = p.parse_args()
    enforce_training_gate(gate_args)
    if a.epochs < 1 or a.batch_size < 2 or a.unfreeze_last_blocks < 1:
        p.error("epochs >= 1, batch-size >= 2 and unfreeze-last-blocks >= 1 are required")
    if a.temperature <= 0 or a.learning_rate <= 0:
        p.error("temperature and learning rate must be positive")

    random.seed(a.seed); np.random.seed(a.seed); torch.manual_seed(a.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(a.seed)
    rows, classes = load_rows(a.manifest, a.image_root)
    train_rows = [r for r in rows if r["split"] == "train"]
    test_rows = [r for r in rows if r["split"] == "test"]
    if len(train_rows) < 2:
        raise ValueError("At least two audited training images are required for contrastive learning")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device={device}; unlabeled_train={len(train_rows)}; heldout_test={len(test_rows)}; classes={len(classes)}", flush=True)
    teacher = load_model(a.teacher_checkpoint, classes, device)
    teacher.eval()
    for param in teacher.parameters():
        param.requires_grad = False
    student = load_model(a.teacher_checkpoint, classes, device)

    for param in student.parameters():
        param.requires_grad = False
    blocks = list(student.features.children())
    if a.unfreeze_last_blocks > len(blocks):
        raise ValueError(f"unfreeze-last-blocks cannot exceed {len(blocks)}")
    for block in blocks[-a.unfreeze_last_blocks:]:
        for param in block.parameters():
            param.requires_grad = True
    for param in student.classifier.parameters():
        param.requires_grad = True
    trainable = [param for param in student.parameters() if param.requires_grad]

    aug = transforms.Compose([
        transforms.RandomResizedCrop(a.image_size, scale=(0.82, 1.0), ratio=(0.9, 1.1)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.12, contrast=0.12, saturation=0.10, hue=0.015),
        transforms.ToTensor(),
        transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize((a.image_size, a.image_size)), transforms.ToTensor(),
        transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
    ])
    train_loader = DataLoader(TwoViewImages(train_rows, a.image_root, aug), batch_size=a.batch_size,
                              shuffle=True, num_workers=2, drop_last=True, pin_memory=device.type == "cuda")
    if len(train_loader) == 0:
        raise ValueError("Training split is smaller than one batch; reduce batch-size")
    test_loader = DataLoader(EvalImages(test_rows, a.image_root, eval_tf, {c:i for i,c in enumerate(classes)}),
                             batch_size=a.batch_size, shuffle=False, num_workers=2)

    optimizer = torch.optim.AdamW(trainable, lr=a.learning_rate, weight_decay=1e-4)
    history = []
    a.out.mkdir(parents=True, exist_ok=True)
    teacher_hash = sha256_file(a.teacher_checkpoint)
    manifest_hash = sha256_text(a.manifest)

    for epoch in range(1, a.epochs + 1):
        student.train()
        # Frozen BatchNorm layers must not silently drift with the new image distribution.
        for module in student.modules():
            if isinstance(module, nn.BatchNorm2d) and not any(p.requires_grad for p in module.parameters()):
                module.eval()
        totals = Counter()
        for step, (view1, view2) in enumerate(train_loader, 1):
            view1, view2 = view1.to(device), view2.to(device)
            with torch.no_grad():
                teacher_logits1 = teacher(view1)
                teacher_logits2 = teacher(view2)
            optimizer.zero_grad(set_to_none=True)
            f1, logits1 = forward_representation_and_logits(student, view1)
            f2, logits2 = forward_representation_and_logits(student, view2)
            c_loss = contrastive_loss(f1, f2, a.temperature)
            d_loss = 0.5 * (distill_loss(logits1, teacher_logits1, a.temperature) +
                            distill_loss(logits2, teacher_logits2, a.temperature))
            loss = a.contrastive_weight * c_loss + a.distillation_weight * d_loss
            loss.backward()
            torch.nn.utils.clip_grad_norm_(trainable, max_norm=2.0)
            optimizer.step()
            totals["loss"] += float(loss.detach())
            totals["contrastive"] += float(c_loss.detach())
            totals["distillation"] += float(d_loss.detach())
            if step % 20 == 0 or step == len(train_loader):
                print(f"epoch={epoch}/{a.epochs} batch={step}/{len(train_loader)} total={loss.item():.4f} contrastive={c_loss.item():.4f} distill={d_loss.item():.4f}", flush=True)
        count = len(train_loader)
        record = {"epoch": epoch, **{k: v / count for k, v in totals.items()}}
        history.append(record)
        print(json.dumps(record), flush=True)

    # One final held-out evaluation of teacher and student; no checkpoint selection on test.
    teacher_metrics = evaluate(teacher, test_loader, device, classes)
    student_metrics = evaluate(student, test_loader, device, classes)
    payload = {"state_dict": {k:v.detach().cpu() for k,v in student.state_dict().items()},
               "classes": classes, "architecture": "mobilenet_v3_small",
               "research_status": "experimental_self_supervised_distillation_candidate",
               "teacher_checkpoint_sha256": teacher_hash, "manifest_sha256": manifest_hash}
    atomic_torch_save(payload, a.out / "candidate-model.pt")
    metrics = {
        "status": "research_candidate_not_for_app",
        "method": "two_view_contrastive_learning_plus_frozen_teacher_knowledge_distillation",
        "architecture": "MobileNetV3-Small", "teacher_checkpoint": str(a.teacher_checkpoint),
        "teacher_checkpoint_sha256": teacher_hash, "manifest_sha256": manifest_hash,
        "classes": classes, "image_size": a.image_size, "epochs": a.epochs,
        "unfreeze_last_blocks": a.unfreeze_last_blocks, "contrastive_weight": a.contrastive_weight,
        "distillation_weight": a.distillation_weight, "temperature": a.temperature,
        "train_images_unlabeled": len(train_rows), "test_images": len(test_rows),
        "history": history, "teacher_test": teacher_metrics, "candidate_test": student_metrics,
        "delta_accuracy": student_metrics["accuracy"] - teacher_metrics["accuracy"],
        "delta_macro_f1": student_metrics["macro_f1"] - teacher_metrics["macro_f1"],
        "limitations": [
            "NGLD labels are not expert-reviewed; labels are deliberately ignored during self-supervised training.",
            "The test split is from the same source and only pHash-group-isolated, not independent by vineyard, plant or capture session.",
            "This experiment tests representation adaptation and retention only; it does not establish unseen-disease understanding or Syrian field accuracy.",
            "A candidate is not promoted if it regresses; an independent field benchmark is still required.",
        ],
    }
    (a.out / "metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": metrics["status"], "teacher_test_accuracy": teacher_metrics["accuracy"],
                      "candidate_test_accuracy": student_metrics["accuracy"],
                      "delta_accuracy": metrics["delta_accuracy"], "teacher_macro_f1": teacher_metrics["macro_f1"],
                      "candidate_macro_f1": student_metrics["macro_f1"], "delta_macro_f1": metrics["delta_macro_f1"]}, indent=2), flush=True)


if __name__ == "__main__":
    main()
