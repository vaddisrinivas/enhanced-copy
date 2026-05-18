export function showToast(message: string): void {
  const toast = document.createElement("div");
  toast.className = "enhanced-copy-toast";
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "#101828",
    color: "#fff",
    font: "500 13px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    boxShadow: "0 12px 32px rgba(16, 24, 40, 0.24)"
  });
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 1600);
}

export function showCopyFallback(text: string): void {
  const overlay = document.createElement("div");
  overlay.className = "enhanced-copy-fallback";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "grid",
    placeItems: "center",
    background: "rgba(15, 23, 42, 0.42)"
  });

  const dialog = document.createElement("div");
  Object.assign(dialog.style, {
    width: "min(720px, calc(100vw - 32px))",
    background: "#fff",
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    boxShadow: "0 18px 56px rgba(16, 24, 40, 0.26)",
    padding: "16px"
  });

  const title = document.createElement("div");
  title.textContent = "Copy enhanced text";
  Object.assign(title.style, {
    font: "700 15px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#101828",
    marginBottom: "10px"
  });

  const textarea = document.createElement("textarea");
  textarea.value = text;
  Object.assign(textarea.style, {
    width: "100%",
    minHeight: "260px",
    resize: "vertical",
    boxSizing: "border-box",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "10px",
    font: "13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  });

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  Object.assign(close.style, {
    marginTop: "12px",
    padding: "8px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#fff",
    color: "#101828",
    cursor: "pointer"
  });
  close.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });

  dialog.append(title, textarea, close);
  overlay.append(dialog);
  document.body.append(overlay);
  textarea.focus();
  textarea.select();
}
