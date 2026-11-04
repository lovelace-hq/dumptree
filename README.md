# Dumptree

A browser-only PHP var_dump workbench, styled to match [Paramtree](https://paramtree.pages.dev).

Live at https://dumptree.pages.dev

Paste plain var_dump output to inspect collapsible trees, flat paths, or JSON. Supports multiple roots, UTF-8 byte-length strings (including quotes and newlines), arrays, objects with visibility and declaring classes, enums, resources, uninitialized values, recursion markers, references, and scalar types.

Search keys or values, hide protected/private properties, copy PHP access paths, expand/collapse all, export JSON, and share through a URL fragment. Starts blank. The example is entirely fictional.

## Development

Node.js 20 or newer. Run npm ci, npm test, and npm run build. Static deployment directory is site/. The parser is custom bounded recursive descent because searched npm alternatives handled print_r or emitted dumps rather than reading the required format.

Run node verify.mjs for live Playwright checks and desktop/mobile screenshots in evidence/. Install Chromium first with npx playwright install chromium.

## Privacy and safety

No backend, accounts, analytics, eval, or HTML insertion. All dump text renders through textContent. Bunny Fonts receives font requests but never the dump. Share links include the entire original dump, including private properties; treat these links as sensitive. Root-variable edits affect display/copy paths, not the PHP data.

Input limits are one million JS characters, 20,000 values and 100 nesting levels. PHP string lengths are checked against UTF-8 bytes; invalid byte encodings cannot be represented losslessly by a browser textarea. Plain output only, not Xdebug/HTML or truncated dumps. Entry counts are validated, and errors include line numbers.

JSON is deliberately a values-only export. Classes, visibility and object IDs remain visible in the inspector, not encoded as invented JSON fields. Nonfinite floats, unsafe-size integers, enums, resource types, uninitialized types and recursion markers export as strings. Sparse PHP arrays export as objects, dense zero-indexed arrays as arrays, empty arrays as [].

## Fonts

DM Sans and Literata font files and OFL licenses are in site/fonts. JetBrains Mono loads from Bunny Fonts. Shared visual styles originate from the provided design kit and Paramtree.
