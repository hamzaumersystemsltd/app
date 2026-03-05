export const nameRegex = /^[A-Za-z\s'-]+$/;
export const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
export const currencyRegex = /^(?:\d+(?:\.\d{1,2})?)$/;
export const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

export function evaluatePasswordStrength(pw) {
  if (!pw) return { score: 0, label: "Very Weak", color: "#d9534f", width: "0%" };
  let score = 0;
  const lengthScore = pw.length >= 12 ? 2 : pw.length >= 8 ? 1 : 0;
  score =
    lengthScore +
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (/[^\w\s]/.test(pw) ? 1 : 0);

  if (score > 5) score = 5;
  const map = {
    0: ["Very Weak", "#d9534f"],
    1: ["Very Weak", "#d9534f"],
    2: ["Weak", "#f0ad4e"],
    3: ["Fair", "#f0d54e"],
    4: ["Good", "#5cb85c"],
    5: ["Strong", "#2e8b57"],
  };
  const [label, color] = map[score] || ["Very Weak", "#d9534f"];
  return { score, label, color, width: `${(score / 5) * 100}%` };
}