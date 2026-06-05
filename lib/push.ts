import webpush from "web-push";

function cleanKey(value: string | undefined) {
  return value?.trim().replace(/=/g, "");
}

const publicKey = cleanKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
const subject =
  process.env.VAPID_SUBJECT?.trim() || "mailto:ravixgamestudios@gmail.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function getWebPush() {
  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys for web push notifications.");
  }

  return webpush;
}