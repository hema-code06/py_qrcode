(() => {
  const input = document.getElementById("qrInput");
  const preview = document.getElementById("qrPreview");
  const placeholder = document.getElementById("qrPlaceholder");
  const sweep = document.getElementById("qrSweep");
  const downloadBtn = document.getElementById("downloadBtn");
  const charCountValue = document.getElementById("charCountValue");

  const DEBOUNCE_MS = 250;
  let debounceTimer = null;
  let activeObjectUrl = null;

  function setEmptyState() {
    preview.hidden = true;
    preview.src = "";
    placeholder.hidden = false;
    downloadBtn.disabled = true;
  }

  function revealPreview(objectUrl) {
    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = objectUrl;

    preview.src = objectUrl;
    preview.hidden = false;
    placeholder.hidden = true;
    downloadBtn.disabled = false;

    sweep.classList.remove("is-active");
    void sweep.offsetWidth; 
    sweep.classList.add("is-active");
  }

  async function requestQr(path) {
    const text = input.value.trim();
    if (!text) return null;

    const formData = new FormData();
    formData.append("data", text);

    const response = await fetch(path, { method: "POST", body: formData });
    if (!response.ok) return null;
    return response.blob();
  }

  function scheduleLivePreview() {
    clearTimeout(debounceTimer);

    const text = input.value.trim();
    charCountValue.textContent = input.value.length;

    if (!text) {
      setEmptyState();
      return;
    }

    debounceTimer = setTimeout(async () => {
      const blob = await requestQr("/preview");
      if (!blob) {
        setEmptyState();
        return;
      }
      revealPreview(URL.createObjectURL(blob));
    }, DEBOUNCE_MS);
  }

  async function handleDownload() {
    if (downloadBtn.disabled) return;

    const blob = await requestQr("/download");
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  input.addEventListener("input", scheduleLivePreview);
  downloadBtn.addEventListener("click", handleDownload);
})();
