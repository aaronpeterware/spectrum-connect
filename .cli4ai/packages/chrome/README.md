# @cli4ai/chrome

> Official @cli4ai package • https://cli4ai.com • Install cli4ai: `npm i -g cli4ai`

Chrome browser automation via Puppeteer. Launches a managed browser instance with persistent profile - no need to quit your existing browser or enable remote debugging.

## Setup

```bash
npm i -g cli4ai
cli4ai add -g chrome
```

## Usage

```bash
# Navigate to a URL (auto-launches browser if not running)
cli4ai run chrome navigate https://example.com

# Run in headless mode (no visible window)
cli4ai run chrome --headless navigate https://example.com

# Screenshot
cli4ai run chrome screenshot output.png --full-page

# Get page text
cli4ai run chrome text
```

## Commands

### Browser Management

```bash
cli4ai run chrome launch              # Explicitly launch browser
cli4ai run chrome --headless launch   # Launch in headless mode
cli4ai run chrome close               # Close managed browser
cli4ai run chrome status              # Check if browser is running
cli4ai run chrome tabs                # List open tabs
```

### Navigation

```bash
cli4ai run chrome navigate <url>              # Open URL
cli4ai run chrome navigate <url> --new-tab    # Open in new tab
cli4ai run chrome navigate <url> --wait load  # Wait for: load, domcontentloaded, networkidle0, networkidle2
```

### Interaction

```bash
cli4ai run chrome click <selector>                    # Click element
cli4ai run chrome type <selector> "text"              # Type into input
cli4ai run chrome type <selector> "text" --clear      # Clear first, then type
cli4ai run chrome wait <selector>                     # Wait for element
cli4ai run chrome wait <selector> --timeout 5000      # With timeout (ms)
```

### Content Extraction

```bash
cli4ai run chrome html                    # Get full page HTML
cli4ai run chrome html <selector>         # Get element HTML
cli4ai run chrome text                    # Get page text content
cli4ai run chrome text <selector>         # Get element text
cli4ai run chrome cookies                 # Get all cookies
cli4ai run chrome cookies example.com     # Filter by domain
cli4ai run chrome eval "document.title"   # Run JavaScript
```

### Screenshots & PDF

```bash
cli4ai run chrome screenshot                      # Save screenshot.png
cli4ai run chrome screenshot output.png           # Custom filename
cli4ai run chrome screenshot --full-page          # Full page capture
cli4ai run chrome screenshot --selector "#hero"   # Element screenshot
cli4ai run chrome pdf                             # Save page.pdf (headless)
cli4ai run chrome pdf output.pdf                  # Custom filename
```

## Headless Mode

Add `--headless` before any command to run without a visible browser window:

```bash
cli4ai run chrome --headless navigate https://example.com
cli4ai run chrome --headless screenshot
cli4ai run chrome --headless text
```

Headless mode is useful for:
- Automated scraping
- CI/CD pipelines
- Background tasks

## Profile Persistence

Browser data (cookies, localStorage, logins) persists in `~/.cli4ai/chrome/profile/`. This means:
- You stay logged into websites between sessions
- Browser extensions are preserved
- History and settings persist

## Related

Other browser-dependent tools like `@cli4ai/twitter` and `@cli4ai/linkedin` can use the managed browser.
