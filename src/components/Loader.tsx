import { assets } from "../data/assets";

export function Loader() {
  return (
    <div className="loader" aria-hidden="true">
      <div className="loader-mark">
        <img src={assets.logo} alt="" />
      </div>
      <div className="loader-bar">
        <span />
      </div>
    </div>
  );
}

