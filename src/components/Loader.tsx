import { Brand } from "./Brand";

export function Loader() {
  return (
    <div className="loader" aria-hidden="true">
      <div className="loader-mark">
        <Brand inverse />
      </div>
      <div className="loader-bar">
        <span />
      </div>
    </div>
  );
}

