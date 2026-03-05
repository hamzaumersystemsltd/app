
export function FormActions({ isSubmitting, label = "Save" }) {
  return (
    <button className="button" type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : label}
    </button>
  );
}