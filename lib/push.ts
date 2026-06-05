import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@ravixgamestudios@gmail.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function getWebPush() {
  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys for web push notifications.");
  }

  return webpush;
}