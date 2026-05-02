import urllib.request
import urllib.parse


def search(query):
    url = "https://html.duckduckgo.com/html/"
    data = urllib.parse.urlencode({"q": query}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
    )
    try:
        html = urllib.request.urlopen(req).read().decode("utf-8")
    except Exception as e:
        print(f"Error fetching: {e}")
        return

    from html.parser import HTMLParser

    class MyParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.recording = False
            self.results = []
            self.current = []

        def handle_starttag(self, tag, attrs):
            if tag == "a":
                for name, value in attrs:
                    if name == "class" and "result__snippet" in value:
                        self.recording = True

        def handle_endtag(self, tag):
            if tag == "a" and self.recording:
                self.recording = False
                self.results.append("".join(self.current).strip())
                self.current = []

        def handle_data(self, data):
            if self.recording:
                self.current.append(data)

    p = MyParser()
    p.feed(html)
    for i, r in enumerate(p.results):
        print(f"{i + 1}. {r}")


search("can Google Business Profile API post reviews on behalf of user")
search("Google API post Google Review programmatically")
search('site:developers.google.com/my-business/content/review-data "post" review')
