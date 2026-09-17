export function getAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const rawMessage = typeof error === "object" && error !== null && "message" in error ? String(error.message) : "";
  const messages: Record<string, string> = {
    "auth/invalid-api-key": "Firebase rejected the web API key. Replace NEXT_PUBLIC_FIREBASE_API_KEY with the key from the correct Firebase Web App configuration.",
    "API_KEY_INVALID": "Firebase rejected the web API key. Replace NEXT_PUBLIC_FIREBASE_API_KEY with the key from the correct Firebase Web App configuration.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/wrong-password": "The email or password is incorrect.",
    "auth/user-not-found": "The email or password is incorrect.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed before completion.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow popups and try again.",
    "auth/network-request-failed": "Network connection failed. Check your connection and try again.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase yet.",
  };
  const friendlyMessage = messages[code] || "Something went wrong. Please try again.";
  if (process.env.NODE_ENV === "development") {
    const debugDetails = [code || "unknown-error", rawMessage].filter(Boolean).join(": ");
    return `${friendlyMessage} [${debugDetails}]`;
  }
  return friendlyMessage;
}
