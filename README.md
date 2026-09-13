# QR Code Generator

Turn a link, text, email, phone number, Wi-Fi network, or small image into a scannable QR code — live, in your browser.

## About the Project

QR Code Generator is a lightweight, single-screen web app for creating QR codes without any clutter. Pick a content type, fill in the fields, and watch the QR code render instantly as you type. When it looks right, download it as a PNG or SVG. Everything is generated in memory on the server per request — nothing you enter is ever saved, logged, or stored in a database.

## Features

- Live QR preview that updates as you type
- 6 content types: Website URL, Text, Email, Phone, Wi-Fi, Image
- Download as PNG or SVG
- Copy the encoded content to your clipboard
- Clear input validation with helpful error messages
- No accounts, no database, no tracking — fully stateless
- Clean, single-screen, distraction-free interface (light theme)

## Tech Stack

| Layer             | Technology                     |
|-------------------|---------------------------------|
| Backend            | Python, Flask                   |
| QR generation      | `qrcode`, Pillow                 |
| Vector export       | `qrcode.image.svg`              |
| Frontend            | HTML, CSS, JavaScript (vanilla) |
| Fonts               | Google Fonts (Inter)             |
| Production server   | Gunicorn                          |
| Hosting              | Vercel (serverless Python)       |

## Local Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd py_qrcode

# Install dependencies
pip install -r requirements.txt

# Run the app
python api/index.py
```

Then open **http://127.0.0.1:5000** in your browser.

## Future Improvements

1. Custom QR colors and logo/image embedding in the center of the code
2. A vCard / contact-card QR type
3. Batch QR generation from a CSV or list of entries
4. Dark mode toggle
5. Dynamic QR codes with optional scan-count tracking

---

*Built With ❤️ using Python and Flask*
