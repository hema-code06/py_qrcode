from flask import Flask, render_template, request, send_file
import io

import qrcode

app = Flask(__name__, template_folder="../templates", static_folder="../static")

MAX_INPUT_LENGTH = 2000 


def build_qr_png(data: str) -> io.BytesIO:
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    image = qr.make_image(fill_color="#14171F", back_color="#FFFFFF").convert("RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def get_validated_input():
    data = request.form.get("data", "").strip()
    if not data:
        return None, ("", 204)
    if len(data) > MAX_INPUT_LENGTH:
        return None, (f"Text is too long (max {MAX_INPUT_LENGTH} characters).", 413)
    return data, None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/preview", methods=["POST"])
def preview():
    data, error = get_validated_input()
    if error:
        return error
    return send_file(build_qr_png(data), mimetype="image/png")


@app.route("/download", methods=["POST"])
def download():
    data, error = get_validated_input()
    if error:
        return error
    return send_file(
        build_qr_png(data),
        mimetype="image/png",
        as_attachment=True,
        download_name="qr-code.png",
    )


if __name__ == "__main__":
    app.run(debug=True)
