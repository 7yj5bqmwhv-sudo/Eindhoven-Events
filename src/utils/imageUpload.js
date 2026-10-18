export const IMAGE_FILE_ACCEPT = "image/jpeg,image/png,image/webp";
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_STORED_IMAGE_BYTES = 600 * 1024;
const IMAGE_TYPES = IMAGE_FILE_ACCEPT.split(",");

function rasterDataUrl(value, limit) {
  if (typeof value !== "string" || value.length > Math.ceil(limit / 3) * 4 + 30)
    return false;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4) return false;
  const encoded = match[2];
  const bytes = (encoded.length / 4) * 3 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
  if (bytes < 12 || bytes > limit) return false;
  try {
    const header = atob(encoded.slice(0, 16));
    if (match[1] === "image/jpeg") return header.startsWith("\xff\xd8\xff");
    if (match[1] === "image/png") return header.startsWith("\x89PNG\r\n\x1a\n");
    return header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
  } catch {
    return false;
  }
}

// Saved pictures are raster data URLs, so they survive refreshes without a file service.
export function isUploadedImage(value) {
  return rasterDataUrl(value, MAX_STORED_IMAGE_BYTES);
}

function abortError() {
  return new DOMException("Picture selection was cancelled.", "AbortError");
}

function readFile(file, signal) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
      reader.onload = reader.onerror = reader.onabort = null;
    };
    const finish = (callback, value) => { cleanup(); callback(value); };
    const abort = () => {
      cleanup();
      reader.abort();
      reject(abortError());
    };
    reader.onload = () => finish(resolve, reader.result);
    reader.onerror = () => finish(reject, new Error("This picture could not be read. Please choose it again."));
    reader.onabort = () => finish(reject, abortError());
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) return abort();
    reader.readAsDataURL(file);
  });
}

function decodeImage(source, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
      image.onload = image.onerror = null;
    };
    const abort = () => {
      cleanup();
      image.src = "";
      reject(abortError());
    };
    image.onload = () => { cleanup(); resolve(image); };
    image.onerror = () => {
      cleanup();
      reject(new Error("This picture could not be opened. Choose a valid JPG, PNG or WebP file."));
    };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) return abort();
    image.src = source;
  });
}

export async function prepareImageUpload(file, { signal } = {}) {
  if (signal?.aborted) throw abortError();
  if (!file || !IMAGE_TYPES.includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP picture.");
  if (!file.size) throw new Error("This file is empty. Choose another picture.");
  if (file.size > MAX_IMAGE_FILE_BYTES)
    throw new Error("Choose a picture smaller than 10 MB.");

  const source = await readFile(file, signal);
  if (signal?.aborted) throw abortError();
  if (!source.startsWith(`data:${file.type};base64,`) || !rasterDataUrl(source, MAX_IMAGE_FILE_BYTES))
    throw new Error("This file is not a valid JPG, PNG or WebP picture.");
  const image = await decodeImage(source, signal);
  if (signal?.aborted) throw abortError();
  if (!image.naturalWidth || !image.naturalHeight)
    throw new Error("This picture has no readable dimensions. Choose another picture.");

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this picture. Try an image URL instead.");
  let scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.72, 0.58]) {
        const result = canvas.toDataURL("image/jpeg", quality);
        if (isUploadedImage(result)) return result;
      }
      scale *= 0.75;
    }
    throw new Error("This picture could not be made small enough. Please choose a smaller picture.");
  } finally {
    // Release the canvas backing store after encoding.
    canvas.width = canvas.height = 0;
  }
}
