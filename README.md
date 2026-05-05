# DocuGuard

DocuGuard is a static Next.js web application for watermarking sensitive document copies directly in the browser. It is designed for cases like IC, passport, and driving licence sharing where users need a clear purpose watermark without uploading files to any server.

## Highlights

- client-side only processing with HTML5 Canvas
- no backend image handling
- no document storage
- live front/back preview
- repeat or single watermark placement
- drag-to-position support for single watermark mode
- PDF export with single-page or split-file output
- optional PDF password protection
- adjustable export quality for smaller file sizes

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- jsPDF

## Local Development

Node.js `>=18.18.0` is required.

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Project Structure

```text
app/
  layout.tsx
  page.tsx

components/
  ControlsPanel.tsx
  DocuGuardApp.tsx
  PreviewCanvas.tsx
  PresetButtons.tsx
  UploadZone.tsx

lib/
  pdf.ts
  utils.ts
  watermark.ts
```

## Security Notes

- All image processing happens in the browser.
- Files are never uploaded by the application.
- Exported PDFs can optionally be password protected.

## Deployment

This project is configured for static export and can be deployed to Vercel or any static hosting environment.
