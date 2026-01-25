# @cli4ai/nanobanana

> Official @cli4ai package • https://cli4ai.com • Install cli4ai: `npm i -g cli4ai`

Image generation with Gemini (Nano Banana Pro) via a connected Chrome session.

## Setup

```bash
npm i -g cli4ai
cli4ai add -g chrome nanobanana
```

1) Start Chrome with remote debugging (see `@cli4ai/chrome`), then:

```bash
cli4ai run chrome connect
```

2) Make sure you’re logged into Gemini in that Chrome session.

## Commands

```bash
cli4ai run nanobanana image "<prompt>"
```

## Notes

- The tool triggers a download to `~/Downloads` and returns the downloaded file path as JSON.
