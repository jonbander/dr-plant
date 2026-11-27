import csv, hashlib, json, subprocess, sys, tempfile, unittest
from pathlib import Path
SCRIPT = Path(__file__).with_name('extract-manifest.py')

class ExtractManifestTests(unittest.TestCase):
    def run_extract(self, source_text, extra=(), path_map=None):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            source = root / 'source.csv'
            output = root / 'out.csv'
            report = root / 'report.json'
            source.write_text(source_text, encoding='utf-8')
            args = [sys.executable, str(SCRIPT), '--input', str(source), '--output', str(output),
                    '--dataset-id', 'test_set', '--crop', 'grape', '--image-col', 'img',
                    '--label-col', 'label', '--group-col', 'vineyard', '--split-col', 'split',
                    '--source-id', 'test_source', '--group-evidence', 'documented vineyard IDs',
                    '--report', str(report), *extra]
            if path_map:
                mapping = root / 'paths.json'
                mapping.write_text(json.dumps(path_map), encoding='utf-8')
                args += ['--path-map', str(mapping)]
            result = subprocess.run(args, capture_output=True, text=True)
            content = output.read_text(encoding='utf-8') if output.exists() else None
            return result, content, json.loads(report.read_text()) if report.exists() else None

    def test_preserves_group_split_label_and_sha(self):
        r, content, report = self.run_extract('img,label,vineyard,split,sha\na.jpg,Esca,V01,train,abc123\n',
                                               ['--sha-col', 'sha'])
        self.assertEqual(r.returncode, 0, r.stderr + r.stdout)
        row = next(csv.DictReader(content.splitlines()))
        self.assertEqual((row['group_id'], row['split'], row['label'], row['sha256']), ('V01', 'train', 'Esca', 'abc123'))
        self.assertEqual(report['status'], 'EXTRACTED_UNVERIFIED')

    def test_applies_longest_prefix_path_mapping(self):
        r, content, _ = self.run_extract('img,label,vineyard,split\n/old/root/sub/a.jpg,Esca,V01,train\n',
                                          path_map={'paths': {}, 'prefixes': {'/old/root/': 'data/', '/old/root/sub/': 'images/'}})
        self.assertEqual(r.returncode, 0, r.stderr + r.stdout)
        row = next(csv.DictReader(content.splitlines()))
        self.assertEqual(row['image_path'], 'images/a.jpg')

    def test_verify_images_recomputes_sha256(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            source = root / 'source.csv'
            image_root = root / 'images'
            image_root.mkdir()
            (image_root / 'leaf.bin').write_bytes(b'actual image bytes')
            source.write_text('img,label,vineyard,split\nleaf.bin,Esca,V01,train\n', encoding='utf-8')
            output = root / 'out.csv'
            cmd = [sys.executable, str(SCRIPT), '--input', str(source), '--output', str(output),
                   '--dataset-id', 'test_set', '--crop', 'grape', '--image-col', 'img',
                   '--label-col', 'label', '--group-col', 'vineyard', '--split-col', 'split',
                   '--source-id', 'test_source', '--group-evidence', 'documented vineyard IDs',
                   '--image-root', str(image_root), '--verify-images']
            result = subprocess.run(cmd, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            with output.open(newline='', encoding='utf-8') as f:
                row = next(csv.DictReader(f))
            self.assertEqual(row['sha256'], hashlib.sha256(b'actual image bytes').hexdigest())
            self.assertTrue(json.loads(result.stdout)['verify_images'])
            self.assertNotIn(b'\r\n', output.read_bytes())

    def test_fails_missing_group_id(self):
        r, content, report = self.run_extract('img,label,vineyard,split\na.jpg,Esca,,train\n')
        self.assertEqual(r.returncode, 2)
        self.assertIsNone(content)
        self.assertIn('row_2:missing_group_id', report['errors'])

    def test_fails_missing_required_column(self):
        r, content, _ = self.run_extract('img,label,split\na.jpg,Esca,train\n')
        self.assertEqual(r.returncode, 2)
        self.assertIsNone(content)
        self.assertIn('missing_source_columns:vineyard', r.stderr)

if __name__ == '__main__':
    unittest.main()
