# Dr Plant research training baseline

This is a reproducible MobileNetV3-Small baseline for **one task and one crop at a time**. It does not download datasets or certify their labels.

## Environment
Python 3.10+, PyTorch and torchvision. On Colab:
```bash
pip install torch torchvision numpy
```

## Prepare data
After auditing the source archive and license, create a dataset directory with train/val/test class folders. The splits must be grouped by farm/site/plant/season, not randomly by image. Do not put crops from one original photo in different splits. Keep augmented copies in the same split as their source image.

```
dataset/
  train/<class>/
  val/<class>/
  test/<class>/
```

All three splits must contain exactly the same class folder names. Never combine grape leaves and grape bunches, or citrus leaves and fruit, into one classifier.

## Run
```bash
python train_mobilenetv3.py --data /path/to/dataset --out /content/drive/MyDrive/dr-plant-runs/lemon-v1 --epochs 25
```

The script saves best.pt, history.json and test_report.json. The test set is evaluated only after selecting the best validation checkpoint.

## Mandatory gates before a dataset is admitted
- Confirm the exact dataset version, DOI, license and attribution obligations.
- Hash files and check perceptual duplicates across source datasets.
- Inspect random examples and class labels with a plant pathologist.
- Ensure group-level split isolation before augmentation.
- Preserve an untouched Syrian coastal external test set.
- Add unknown/unsupported and low-quality abstention evaluation before any app integration.

This baseline does not implement calibrated confidence, abstention, ONNX export or app integration. Do not interpret its accuracy as deployment readiness.
