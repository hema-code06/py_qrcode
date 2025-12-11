from flask import Flask, render_template, request, send_file
import qrcode
from PIL import Image
import io

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/preview", methods=["POST"])
def preview():
    data = request.form.get("data", "")
    if not data.strip():
        return "", 204

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    buffer = io.BytesIO()
    img.save(buffer, "PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png")


@app.route("/download", methods=["POST"])
def download():
    data = request.form.get("data", "")
    if not data.strip():
        return "", 204

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    buffer = io.BytesIO()
    img.save(buffer, "PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png", as_attachment=True, download_name="qr_code.png")


if __name__ == "__main__":
    app.run(debug=True)
