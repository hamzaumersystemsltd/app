import { Link, useLocation } from "react-router-dom";
import "./breadcrumbs.css";

const HIDE_EXACT = ["/"];
const HIDE_PREFIX = ["/login", "/register"];
const Breadcrumbs = () => {
  const location = useLocation();
  const pathname = location.pathname;

  if (HIDE_EXACT.includes(pathname)) {
    return null;
  }

  if (HIDE_PREFIX.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const pathnames = pathname.split("/").filter((x) => x);

  return (
    <nav className="bc-container" aria-label="Breadcrumb">
      <ul className="bc-list">
        <li className="bc-item">
          <Link to="/" className="bc-link">Home</Link>
        </li>

        {pathnames.map((value, index) => {
          const to = "/" + pathnames.slice(0, index + 1).join("/");
          return (
            <li className="bc-item" key={to}>
              <span className="bc-sep" aria-hidden="true">/</span>
              <Link to={to} className="bc-link">{value}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;