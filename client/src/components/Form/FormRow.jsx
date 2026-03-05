
export default function FormRow({ children, cols = "three", className = "" }) {
  return <div className={`form-row ${cols === "two" ? "two" : ""} ${className}`}>{children}</div>;
}