import shutil, subprocess, sys, tempfile, unittest
from pathlib import Path
SCRIPT = Path(__file__).with_name('audit-phash.py')

@unittest.skipUnless(shutil.which('convert'), 'ImageMagick convert is required')
class PhashTests(unittest.TestCase):
    def test_identical_images_have_zero_hamming_distance(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'a.png'
            subprocess.run(['convert', '-size', '64x64', 'gradient:black-white', str(p)], check=True)
            sys.path.insert(0, str(SCRIPT.parent))
            import importlib.util
            spec = importlib.util.spec_from_file_location('audit_phash', SCRIPT)
            mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
            self.assertEqual(mod.hamming(mod.phash(p), mod.phash(p),), 0)

    def test_status_fails_cross_split_and_reviews_same_split_pairs(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location('audit_phash_status', SCRIPT)
        mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
        self.assertEqual(mod.classify_status([]), 'PASS')
        self.assertEqual(mod.classify_status([{'cross_split': False}]), 'REVIEW_REQUIRED')
        self.assertEqual(mod.classify_status([{'cross_split': True}]), 'FAIL')

    def test_near_identical_images_have_small_distance(self):
        with tempfile.TemporaryDirectory() as d:
            a, b = Path(d)/'a.png', Path(d)/'b.png'
            subprocess.run(['convert', '-size', '64x64', 'xc:white', '-fill', 'black', '-draw', 'circle 32,32 32,10', str(a)], check=True)
            subprocess.run(['convert', str(a), '-fill', 'white', '-draw', 'point 2,2', str(b)], check=True)
            sys.path.insert(0, str(SCRIPT.parent))
            import importlib.util
            spec = importlib.util.spec_from_file_location('audit_phash', SCRIPT)
            mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
            self.assertLessEqual(mod.hamming(mod.phash(a), mod.phash(b)), 6)

if __name__ == '__main__': unittest.main()
