let UAParser;
try {
  UAParser = require("ua-parser-js");
} catch {
  UAParser = null;
}

function parseDevice(userAgent) {
  if (!userAgent) {
    return { label: "Unknown device", browser: null, os: null };
  }
  if (!UAParser) {
    return {
      label: String(userAgent).slice(0, 80),
      browser: null,
      os: null,
    };
  }
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  const parts = [
    browser.name && browser.version
      ? `${browser.name} ${browser.version}`
      : browser.name,
    os.name && os.version ? `${os.name} ${os.version}` : os.name,
    device.type || device.vendor,
  ].filter(Boolean);
  return {
    label: parts.join(" · ") || "Unknown device",
    browser: browser.name || null,
    os: os.name || null,
  };
}

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

module.exports = { parseDevice, clientIp };
