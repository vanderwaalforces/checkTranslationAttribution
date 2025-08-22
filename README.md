The Wikipedia translation attribution checker is a script designed to help editors quickly check whether articles that are translations from other language Wikipedias have been properly attributed. It checks the [edit summaries](https://en.wikipedia.org/wiki/Wikipedia:EDITSUM) and talk pages for signs of proper attribution and displays warnings or notices accordingly. This script is particularly useful for ensuring that articles translated from other languages follow English Wikipedia's guidelines on proper attribution of translations based on [WP:TFOLWP](https://en.wikipedia.org/wiki/Wikipedia:TFOLWP).

# Features
- Detects if the oldest 50 edit summaries contain the word "translat" and an interwiki link pointing to a source Wikipedia page.
- Checks the talk page for mentions of "translat".
- Displays a warning if proper attribution is missing from the edit summary.
- Displays a notice when proper attribution is found, and optionally suggests adding a [{{Translated page}}](https://en.wikipedia.org/wiki/Template:Translated_page) template to the talk page if it's missing.
- Works across many Wikipedia skins (Vector (Legacy and 2022), Monobook, etc.)
- Positions messages neatly before the #contentSub element, ensuring visibility in all skins, except Minerva which does not display `#contentSub` itself.
# Installation
To install this script on your Wikipedia account, follow these steps:

- Go to your [common.js](https://en.wikipedia.org/wiki/Special:MyPage/common.js) page.
- Add the following line to your page:
`mw.loader.load('/w/index.php?title=User:Vanderwaalforces/checkTranslationAttribution.js&action=raw&ctype=text/javascript'); // Backlink: [[User:Vanderwaalforces/checkTranslationAttribution.js]]`
- Save the page. The script will now be active whenever you browse Wikipedia articles.
- Alternatively, you can install the script on your skin-specific JS file (like vector.js for Vector skin or monobook.js for Monobook skin) if you don't want it running across all skins.

# Usage
Once installed, the script will run automatically whenever you're viewing an article in the mainspace (articles) or draftspace. It will:

- Check the edit summaries of the article for mentions of "translat" and an interwiki link pointing to a source Wikipedia.
- Check the talk page for mentions of "translat".
- Display one of the following messages at the top of the page:
- Warning: If the edit summary mentions "translat" but lacks an interwiki link.
- Notice: If both "translat" and an interwiki link are present, the article is correctly attributed.
- Optional Suggestion: If the article is correctly attributed but the talk page doesn't mention "translat", it will suggest adding the {{Translated page}} template.
