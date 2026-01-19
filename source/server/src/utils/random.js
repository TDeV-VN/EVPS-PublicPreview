import crypto from "crypto";
import { validate } from "~/validations/validator.js";

/**
 * Generate a password that satisfies the validator.password regex.
 * - Ensures at least one upper, one lower, one digit and one special char
 * - Target length defaults to 12 (minLength respected)
 */
export const generatePassword = ({
  minLength = 8,
  targetLength = 12,
  maxAttempts = 10,
} = {}) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+[]{}|;:'\",.<>/?~-";

  const allChars = upper + lower + digits + special;
  const pick = (chars) => chars[crypto.randomInt(0, chars.length)];

  const buildCandidate = () => {
    const parts = [pick(upper), pick(lower), pick(digits), pick(special)];
    while (parts.length < Math.max(minLength, targetLength)) {
      parts.push(pick(allChars));
    }
    // Fisher-Yates shuffle
    for (let i = parts.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      const tmp = parts[i];
      parts[i] = parts[j];
      parts[j] = tmp;
    }
    return parts.join("");
  };

  let candidate;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    candidate = buildCandidate();
    if (validate.password.test(candidate)) return candidate;
  }

  // Fallback deterministic password (still satisfies minimal policy)
  const fallback = ["A", "a", "1", "!"];
  while (fallback.join("").length < minLength) fallback.push("x");
  return fallback.join("");
};
