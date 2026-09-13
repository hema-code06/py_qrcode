import base64
import io

from flask import Flask, jsonify, render_template, request, send_file
import qrcode
import qrcode.image.svg
from qrcode.constants import ERROR_CORRECT_L

app = Flask(__name__, template_folder="../templates", static_folder="../static")

MAX_TEXT_LENGTH = 2000        
MAX_QR_CHARS = 2900          
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}


def build_qr_image(data: str, image_factory=None):
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    if image_factory is not None:
        return qr.make_image(image_factory=image_factory)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")


def resolve_payload():
    upload = request.files.get("image")

    if upload and upload.filename:
        extension = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else ""
        if extension not in ALLOWED_IMAGE_EXTENSIONS:
            return None, (jsonify(error="Only JPG, JPEG, or PNG files are supported."), 400)

        raw_bytes = upload.read()
        if not raw_bytes:
            return None, (jsonify(error="That image file is empty."), 400)

        mime = "image/png" if extension == "png" else "image/jpeg"
        encoded = base64.b64encode(raw_bytes).decode("ascii")
        content = f"data:{mime};base64,{encoded}"

        if len(content) > MAX_QR_CHARS:
            return None, (
                jsonify(
                    error=(
                        f"This image ({len(raw_bytes):,} bytes) is too large to fit in a QR code. "
                        "QR codes can hold about 2KB of data - try a smaller or more compressed image."
                    )
                ),
                400,
            )
        return content, None

    data = (request.form.get("data") or "").strip()
    if not data:
        return None, (jsonify(error="Please enter some content first."), 400)
    if len(data) > MAX_TEXT_LENGTH:
        return None, (jsonify(error=f"Content is too long (max {MAX_TEXT_LENGTH} characters)."), 400)
    return data, None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/preview", methods=["POST"])
def preview():
    content, error = resolve_payload()
    if error:
        body, status = error
        return body, status

    buffer = io.BytesIO()
    build_qr_image(content).save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png")


@app.route("/download", methods=["POST"])
def download():
    content, error = resolve_payload()
    if error:
        body, status = error
        return body, status

    file_format = request.form.get("format", "png").lower()

    if file_format == "svg":
        image = build_qr_image(content, image_factory=qrcode.image.svg.SvgPathImage)
        buffer = io.BytesIO()
        image.save(buffer)
        buffer.seek(0)
        return send_file(
            buffer, mimetype="image/svg+xml", as_attachment=True, download_name="qr-code.svg"
        )

    buffer = io.BytesIO()
    build_qr_image(content).save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png", as_attachment=True, download_name="qr-code.png")


if __name__ == "__main__":
    app.run(debug=True)
