(() => {
  const tabs = document.querySelectorAll(".type-tab");
  const fieldGroups = document.querySelectorAll(".field-group");
  const errorMessage = document.getElementById("errorMessage");

  const qrImage = document.getElementById("qrImage");
  const qrPlaceholder = document.getElementById("qrPlaceholder");
  const downloadPngBtn = document.getElementById("downloadPngBtn");
  const downloadSvgBtn = document.getElementById("downloadSvgBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const fileNameLabel = document.getElementById("fileName");

  const fields = {
    url: document.getElementById("f-url"),
    text: document.getElementById("f-text"),
    emailTo: document.getElementById("f-email-to"),
    emailSubject: document.getElementById("f-email-subject"),
    emailBody: document.getElementById("f-email-body"),
    phone: document.getElementById("f-phone"),
    wifiSsid: document.getElementById("f-wifi-ssid"),
    wifiSecurity: document.getElementById("f-wifi-security"),
    wifiPassword: document.getElementById("f-wifi-password"),
    wifiHidden: document.getElementById("f-wifi-hidden"),
    image: document.getElementById("f-image"),
  };

  let currentType = "url";
  let activeObjectUrl = null;
  let debounceTimer = null;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      currentType = tab.dataset.type;
      fieldGroups.forEach((group) => {
        group.hidden = group.dataset.fields !== currentType;
      });

      setEmptyState();
      showError("");
      copyBtn.hidden = currentType === "image";
    });
  });

  function showError(message) {
    if (!message) {
      errorMessage.hidden = true;
      errorMessage.textContent = "";
      return;
    }
    errorMessage.hidden = false;
    errorMessage.textContent = message;
  }

  function escapeWifi(value) {
    return value.replace(/([\\;,:"])/g, "\\$1");
  }

  function normalizeUrl(value) {
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
      return `https://${value}`;
    }
    return value;
  }

  function buildContent() {
    switch (currentType) {
      case "url": {
        const value = fields.url.value.trim();
        if (!value) return { content: null };
        return { content: normalizeUrl(value) };
      }
      case "text": {
        const value = fields.text.value.trim();
        if (!value) return { content: null };
        return { content: value };
      }
      case "email": {
        const to = fields.emailTo.value.trim();
        if (!to) return { content: null };
        if (!EMAIL_RE.test(to)) return { content: null, error: "Enter a valid email address." };
        const params = [];
        const subject = fields.emailSubject.value.trim();
        const body = fields.emailBody.value.trim();
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        const query = params.length ? `?${params.join("&")}` : "";
        return { content: `mailto:${to}${query}` };
      }
      case "phone": {
        const value = fields.phone.value.trim();
        if (!value) return { content: null };
        if (!/^[0-9+\-\s()]{6,20}$/.test(value)) {
          return { content: null, error: "Enter a valid phone number." };
        }
        return { content: `tel:${value.replace(/[\s()-]/g, "")}` };
      }
      case "wifi": {
        const ssid = fields.wifiSsid.value.trim();
        if (!ssid) return { content: null };
        const security = fields.wifiSecurity.value;
        const password = fields.wifiPassword.value;
        if (security !== "nopass" && !password) {
          return { content: null, error: "Enter the Wi-Fi password, or set security to None." };
        }
        const hidden = fields.wifiHidden.checked ? "true" : "false";
        const passSegment = security === "nopass" ? "" : `P:${escapeWifi(password)};`;
        return {
          content: `WIFI:T:${security};S:${escapeWifi(ssid)};${passSegment}H:${hidden};;`,
        };
      }
      default:
        return { content: null };
    }
  }

  function setEmptyState() {
    if (activeObjectUrl) {
      URL.revokeObjectURL(activeObjectUrl);
      activeObjectUrl = null;
    }
    qrImage.hidden = true;
    qrImage.src = "";
    qrPlaceholder.hidden = false;
    downloadPngBtn.disabled = true;
    downloadSvgBtn.disabled = true;
  }

  function revealPreview(objectUrl) {
    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = objectUrl;
    qrImage.src = objectUrl;
    qrImage.hidden = false;
    qrPlaceholder.hidden = true;
    downloadPngBtn.disabled = false;
    downloadSvgBtn.disabled = false;
  }

  async function requestQr(path, extra = {}) {
    const formData = new FormData();

    if (currentType === "image") {
      const file = fields.image.files[0];
      if (!file) return { ok: false };
      formData.append("image", file);
    } else {
      const { content, error } = buildContent();
      if (error) {
        showError(error);
        return { ok: false };
      }
      if (!content) return { ok: false };
      formData.append("data", content);
    }

    Object.entries(extra).forEach(([key, value]) => formData.append(key, value));

    const response = await fetch(path, { method: "POST", body: formData });
    if (!response.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const body = await response.json();
        if (body.error) message = body.error;
      } catch (_) {
        /* ignore parse failure, use default message */
      }
      showError(message);
      return { ok: false };
    }
    showError("");
    return { ok: true, blob: await response.blob() };
  }

  function scheduleLivePreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const result = await requestQr("/preview");
      if (result.ok) {
        revealPreview(URL.createObjectURL(result.blob));
      } else {
        setEmptyState();
      }
    }, 250);
  }

  [
    fields.url,
    fields.text,
    fields.emailTo,
    fields.emailSubject,
    fields.emailBody,
    fields.phone,
    fields.wifiSsid,
    fields.wifiPassword,
  ].forEach((el) => el.addEventListener("input", scheduleLivePreview));

  [fields.wifiSecurity, fields.wifiHidden].forEach((el) =>
    el.addEventListener("change", scheduleLivePreview)
  );

  fields.image.addEventListener("change", () => {
    const file = fields.image.files[0];
    fileNameLabel.textContent = file ? file.name : "";
    if (!file) {
      setEmptyState();
      return;
    }
    scheduleLivePreview();
  });

  clearBtn.addEventListener("click", () => {
    fields.url.value = "";
    fields.text.value = "";
    fields.emailTo.value = "";
    fields.emailSubject.value = "";
    fields.emailBody.value = "";
    fields.phone.value = "";
    fields.wifiSsid.value = "";
    fields.wifiSecurity.value = "WPA";
    fields.wifiPassword.value = "";
    fields.wifiHidden.checked = false;
    fields.image.value = "";
    fileNameLabel.textContent = "";
    showError("");
    setEmptyState();
  });

  copyBtn.addEventListener("click", async () => {
    const { content } = buildContent();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      const original = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = original), 1200);
    } catch (_) {
      showError("Couldn't copy to clipboard.");
    }
  });

  async function handleDownload(format) {
    const result = await requestQr("/download", { format });
    if (!result.ok) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = format === "svg" ? "qr-code.svg" : "qr-code.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  downloadPngBtn.addEventListener("click", () => handleDownload("png"));
  downloadSvgBtn.addEventListener("click", () => handleDownload("svg"));
})();
