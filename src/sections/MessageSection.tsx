import { SplitText } from "../components/SplitText";

export function MessageSection() {
  return (
    <section className="message-section" aria-label="Pantry-to-Plate message">
      <div className="message-wrap">
        <h2>
          <span className="message-word">
            <SplitText text="Plan around what you have," by="words" />
          </span>
          <span className="text-scroll">
            <span>cook what you love</span>
          </span>
          <span className="text-scroll text-scroll--sage">
            <span>shop only what is missing</span>
          </span>
          <span className="text-scroll text-scroll--turmeric">
            <span>balance every plate</span>
          </span>
          <span className="text-scroll text-scroll--evergreen">
            <span>waste less every week</span>
          </span>
          <span className="message-word">
            <SplitText text="without losing the joy of dinner." by="words" />
          </span>
        </h2>
        <p className="message-copy">
          The app connects pantry scanning, recipe discovery, meal planning, shopping, nutrition,
          and cooking mode into one warm daily flow.
        </p>
      </div>
    </section>
  );
}

