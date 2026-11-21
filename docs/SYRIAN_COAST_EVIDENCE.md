# Syrian coastal plant-health evidence register — 21 November 2026

## Purpose and boundary

This file links peer-reviewed or institutional research about Latakia, Jableh, Tartous and nearby coastal agricultural areas to Dr Plant's research workflow. It is a **source and collection-priority register**, not a Syrian training dataset. No images are supplied by these references unless a source explicitly provides an archive and its license has been checked. Historical incidence figures are not current prevalence, and laboratory-confirmed pathogen records are not interchangeable with visual symptom labels.

## Highest-priority image acquisition lead

### Grapevine leaves — Alkan et al. (2021)

- Paper: [A smart agricultural application: automated detection of diseases in vine leaves using hybrid deep learning](https://journals.tubitak.gov.tr/agriculture/vol45/iss6/3/)
- DOI: `10.3906/tar-2007-105`
- Authors include Ahmet Alkan, Muhammed Usame Abdullah, Hanadi Omaish Abdullah and Muhammed Assaf.
- The abstract reports **over 1,000** grapevine-leaf images collected from Syrian vineyards and the internet. It reports a best experimental accuracy of 92.5% for AlexNet + transfer learning.
- **Provenance issue:** the abstract does not split the Syrian and internet image counts. A 2024 review lists the dataset location differently (Türkiye/PlantVillage): [review](https://doi.org/10.3390/s24196211). This conflict must be resolved from the full text, source image manifest and authors before any images are accepted.
- No public downloadable archive or reusable image license was verified in the journal record. Treat as `author_contact_required`; do not scrape figures or copy images from unofficial mirrors.
- Ask authors for: original image archive; per-image source country/governorate/site; collection date and cultivar; exact disease label and diagnostic method; train/validation/test membership; duplicate policy; image ownership and written reuse permission; publication citation and attribution requirements.

## Citrus

### Citrus tristeza virus (CTV)

- Primary paper: [Abou Kubaa et al. (2008), Plant Disease](https://apsjournals.apsnet.org/doi/10.1094/PDIS-92-10-1468C).
- Surveyed spring 2006 in Latakia (including Jableh) and Tartous. The EPPO summary reports **2,653 samples tested and 89 positives (~3.35%)**: [EPPO record](https://gd.eppo.int/reporting/article-147).
- This is historical, serological evidence, not a current prevalence estimate or a visual diagnosis. The alternative `288 samples / 61.23%` figure in an incoming lead is **not supported by this paper** and remains unlinked until its original citation is identified.

### Citrus psorosis virus (CPsV)

- [Abou Kubaa et al. (2014), first report of CPsV in Syria](https://www.sipav.org/en/16/Archive/3220).
- A 2011 campaign sampled 250 symptomatic and asymptomatic trees, including a Latakia mother block and commercial orchards in Jableh, Tartous and Latakia; two Navel orange trees in Latakia were confirmed by serology and RT-PCR.
- Keep bark/trunk and leaf symptom tasks distinct; the paper is not an image archive.

## Olive

### Olive knot

- [Alabdalla et al. (2009), New Disease Reports](https://www.ndrs.org.uk/article.php?id=019020): field surveys in 2007 reported the highest incidence (70%) in the coastal region (Latakia and Tartous).
- A separate CIHEAM thesis record reports 68% coastal incidence: [CIHEAM catalogue](https://sebina.iamb.it/opac/resource/incidence-distribution-and-characterization-of-pseudomonas-savastanoi-pv-savastanoi-in-syria-and-ide/CIH0019331).
- These are different historical sources and their figures must not be merged or described as current prevalence. Target branch/twig knot images as a separate task from leaf-only classification.
- A 2026 study isolated the pathogen from infected olive trees in Al-Kadmous, Tartous: [Ahmad et al.](https://www.arabjournalpp.org/article/2026/02/5045/).

### Peacock spot / peacock eye

- [Al-Chaabi et al. (2012)](https://arabjournalpp.org/wp-content/uploads/2021/04/110-127.pdf) reports severe historical incidence in the coastal hills, with up to 100% in some cultivar/area combinations in Latakia and Tartous during 2007–2008.
- [Hilal (2025)](https://journalajgr.com/index.php/AJGR/article/view/349) maps peacock-eye severity in Latakia and Idlib for 2009–2012 and studies association with relative humidity. It is a 2025 publication about older observations, not a 2026 coastal survey; it does not include Tartous.
- These references support disease prioritization and field sampling, not model labels or present-day prevalence.

## Greenhouse tomato and pepper

- **ToBRFV:** [Hasan et al. (2022)](https://apsjournals.apsnet.org/doi/10.1094/PDIS-07-21-1356-PDN) reports symptoms observed in 2017 greenhouse tomatoes in the east of Akkar plain, Tartous. Fruit symptoms are important; do not treat it as a leaf-only task.
- **TYLCV/TYLCSV:** [FAO AGRIS 2022 record](https://agris.fao.org/search/ar/records/651a9180528c4f6c2ac8399f) describes coastal greenhouse research on local strains and cultivar responses. Virus identity requires molecular confirmation; leaf yellowing/curling alone is not specific.
- **Bacterial canker:** [Ftayeh et al. (2010)](https://oajournals.fupress.net/index.php/pm/article/view/5342) reports surveys in Latakia and Tartous greenhouses in 2007 and PCR-confirmed isolates.
- **Fusarium wilt:** [Sbieh et al. (2025)](https://www.arabjournalpp.org/article/2025/02/4608/) reports greenhouse sampling in Latakia and Tartous during 2019–2020, pathogenicity confirmation and race-1 identification by PCR.
- **Root-knot nematodes:** [Ahmad et al. (2026)](https://www.arabjournalpp.org/article/2026/03/5266/) reports 273 soil/root samples from 67 coastal locations during 2023–2024. This is a root/soil task, not a leaf image class.
- These sources are not downloadable image datasets. The `288 / 61.23%` citrus statistic and the alleged `Fusarium solani` olive-nursery record were not verified in this pass and are not entered as facts.

## Project findings from repository inspection

- Existing Syrian records were already present in `data/knowledge-base.json`: historical CTV in Latakia/Tartous and grapevine Phomopsis/Diaporthe research in Sweida (southern Syria, not the coast).
- `docs/DIAGNOSTIC_EVIDENCE.md` already stated that no expert-labelled Syrian coastal image set or independent coastal test set was included.
- GitHub Issues search for `repo:jonbander/dr-plant Syria` returned no issues. No new Syrian coastal image files were found in the inspected `data/` tree; the external-data README and existing datasets are not a local Syrian image archive.
- No model was trained or enabled from these references.

## Contact and field collection priorities

1. **First: grapevine image archive.** Contact Alkan, Muhammed Usame Abdullah, Hanadi Omaish Abdullah and Muhammed Assaf. Resolve the provenance discrepancy before requesting permission to reuse the Syrian subset.
2. **Citrus:** contact authors of the CTV/CPsV studies and the Latakia agricultural research center / Tishreen University for historical sample records, orchard metadata and any permitted image archive. Do not assume stored lab samples have photographs.
3. **Olive:** request georeferenced survey tables and any symptom photographs from the authors of the peacock-spot and olive-knot studies and the local research center.
4. **Greenhouse crops:** contact the authors of the TYLCV, ToBRFV, bacterial-canker, Fusarium-wilt and root-knot studies. Keep leaf, fruit, stem, root and soil tasks separate.

For every image, capture: unique image ID; crop/species; cultivar/rootstock; organ; disease/symptom label; label certainty; lab test and result (if any); governorate/district/site; date/season; plant/tree ID; photographer; device; image rights/permission; and reviewer. Keep all images from the same plant/tree, orchard and capture session in one split group. Preserve an `unknown/mixed/other` class and abstain when the evidence is insufficient.

## Training gate

None of these sources can be promoted to training until original images are obtained lawfully, image-level provenance and labels are audited, qualified expert review is recorded, exact and near duplicates are checked, and a site/tree-aware independent holdout is prepared. Do not enable a coastal diagnostic model or claim Syrian accuracy based on literature incidence percentages or published model scores.
