import importlib.util
import unittest
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw

MODULE_PATH=Path(__file__).with_name('research')/'extract_vitis_leaf_shape.py'
SPEC=importlib.util.spec_from_file_location('extract_vitis_leaf_shape',MODULE_PATH)
MODULE=importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)

class VitisLeafShapeTests(unittest.TestCase):
    def fixture(self, count=2):
        im=Image.new('RGB',(320,220),(245,242,190));d=ImageDraw.Draw(im)
        if count>=1:d.ellipse((45,45,135,175),fill=(65,125,25))
        if count>=2:d.ellipse((185,35,275,170),fill=(75,135,35))
        return np.asarray(im)

    def test_extracts_two_interior_leaf_candidates(self):
        found,raw=MODULE.components(self.fixture(2))
        self.assertEqual(len(found),2)
        self.assertGreater(found[0][0],found[1][0]*0.8)

    def test_shape_vector_has_expected_length_and_finite_values(self):
        found,_=MODULE.components(self.fixture(2))
        values=MODULE.shape_features(found[0][1])
        self.assertEqual(len(values),len(MODULE.FEATURES))
        self.assertTrue(np.isfinite(values).all())

    def test_single_leaf_is_not_promoted_to_two_leaf_candidate(self):
        found,_=MODULE.components(self.fixture(1))
        self.assertEqual(len(found),1)

if __name__=='__main__':unittest.main()
