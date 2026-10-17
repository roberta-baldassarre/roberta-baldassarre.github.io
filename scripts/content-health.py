"""Check local HTML targets; inventory external links without requesting them."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json

ROOT = Path(__file__).resolve().parents[1] / 'la-trottola'
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value:
                self.links.append(value)

missing, external = [], {}
for page in sorted(ROOT.glob('*.html')):
    parser = Links()
    parser.feed(page.read_text())
    for value in parser.links:
        url = urlsplit(value)
        if url.scheme in ('https', 'http'):
            external.setdefault(value, []).append(page.name)
        elif not url.scheme and not url.netloc and url.path:
            target = ((ROOT.parent / unquote(url.path).lstrip('/')) if url.path.startswith('/') else (page.parent / unquote(url.path)))
            if not target.exists():
                missing.append({'page': page.name, 'target': value})
report = {'missing_local_targets': missing, 'external_links_for_manual_review': external,
          'scope': 'File existence only. Anchors, external availability, prices and opening hours are not verified.'}
Path('content-health-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'{len(missing)} missing local targets; {len(external)} external URLs inventoried.')
for item in missing:
    print(item)
raise SystemExit(bool(missing))
