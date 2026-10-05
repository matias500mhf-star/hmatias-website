import unittest

from indexnow import BASE, PageSignals, changed_urls, page_path, sitemap_pages


class PublicSubmissionTests(unittest.TestCase):
    def setUp(self):
        self.pages = {
            f"{BASE}/": "index.html",
            f"{BASE}/supply.html": "supply.html",
            f"{BASE}/source-ao/index.html": "source-ao/index.html",
        }

    def test_reject_private_external_and_parameterized_urls(self):
        for path in (
            "/source-ao/ops.html", "/source-ao/review.html",
            "/source-ao/requests.html", "/source-ao/backend/private.html",
            "/source-ao/data/suppliers.json", "/source-ao/docs/private.html",
            "/rfq.html?email=private@example.test", "/rfq.html#contact",
            "/../private.html", "/%2e%2e/private.html",
        ):
            with self.subTest(path=path), self.assertRaises(ValueError):
                page_path(BASE + path)
        for url in ("https://other.example/", "http://comercialhmatiasps.com/",
                    "https://user@comercialhmatiasps.com/"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                page_path(url)

    def test_internal_changes_do_not_notify(self):
        changed = {"source-ao/data/suppliers.json", "source-ao/backend/src/router.js",
                   "source-ao/ops.js", "docs/internal.md", ".github/scripts/indexnow.py"}
        self.assertEqual(changed_urls(self.pages, self.pages, changed), [])

    def test_added_changed_and_deleted_pages(self):
        current = {**self.pages, f"{BASE}/clean.html": "clean.html"}
        del current[f"{BASE}/supply.html"]
        self.assertEqual(changed_urls(current, self.pages, {"index.html"}),
                         sorted([f"{BASE}/", f"{BASE}/clean.html", f"{BASE}/supply.html"]))

    def test_public_data_only_affects_source_pages(self):
        self.assertEqual(changed_urls(self.pages, self.pages,
                                      {"source-ao/data/catalog.json"}),
                         [f"{BASE}/source-ao/index.html"])

    def test_shared_asset_affects_public_pages(self):
        self.assertEqual(changed_urls(self.pages, self.pages, {"header.css"}),
                         sorted(self.pages))

    def test_noindex_and_empty_sitemap(self):
        signals = PageSignals()
        signals.feed('<meta name="robots" content="noindex, follow">')
        self.assertTrue(signals.noindex)
        with self.assertRaises(ValueError):
            sitemap_pages('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>')


if __name__ == "__main__":
    unittest.main()
