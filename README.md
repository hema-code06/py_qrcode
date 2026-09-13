# QR Code Generator

A single-screen QR code generator built with Flask. Choose a type,
fill in the fields, and get a live QR preview you can download as PNG
or SVG. Nothing is stored — each request is generated in memory.

## Supported types
- Website URL
- Text
- Email (with optional subject/body)
- Phone number
- Wi-Fi network (SSID, security, password)
- Image (JPG/JPEG/PNG, embedded directly in the QR — see note below)

### About Image QR codes
A QR code can't link to or store an external file — whatever it holds
has to fit inside the code itself, and a standard QR code tops out at
roughly 2–3KB of data. So "Image" mode base64-encodes the uploaded file
into the QR content directly, which means it only works for very small
images (icons, tiny thumbnails). Larger images are rejected with a clear
error rather than silently failing.

## Project structure
```
api/index.py          Flask app: routes + QR/SVG rendering
templates/index.html  Page markup
static/css/style.css  Styles
static/js/main.js     Type switching, live preview, downloads
```

## Running locally
```bash
pip install -r requirements.txt
python api/index.py
```
Then open http://127.0.0.1:5000.

## Deploying
- **Vercel:** `vercel.json` routes `/` to `api/index.py` and serves
  `/static/*` directly.
- **Heroku / any Procfile host:** `Procfile` runs `gunicorn api.index:app`.
