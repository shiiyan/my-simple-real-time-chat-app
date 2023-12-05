import sha256 from "crypto-js/sha256";

export function generateClientId(): string {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
//   const screenResolution = `${screen.height}x${screen.width}`;
  const timestamp = new Date().getTime();
  const randomComponent = Math.random().toString(36).substring(2, 15);

  const rawId = `${userAgent}-${language}-${timestamp}-${randomComponent}`;
  return sha256(rawId).toString(); // Convert hash to string
}
