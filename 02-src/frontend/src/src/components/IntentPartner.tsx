import "../styles/intent-partner.css";

interface IntentPartnerProps {
  /** "band" sits under the header; "inline" sits inside a page composition. */
  variant?: "band" | "inline";
}

export default function IntentPartner({ variant = "band" }: IntentPartnerProps) {
  return (
    <aside
      className={variant === "inline" ? "intent-partner intent-partner--inline" : "intent-partner"}
      aria-label="Intent Solutions partner status"
      data-intent-partner
    >
      <div className="intent-partner__inner">
        <p className="intent-partner__owner">
          Built by <strong>Intent Solutions</strong>
        </p>
        <a
          className="intent-partner__link"
          href="https://intentsolutions.io/"
          aria-label="About Intent Solutions, a Claude Partner Network Select Services Partner"
        >
          <img
            className="intent-partner__image"
            src="/assets/claude-select-partner.svg"
            alt="Claude Partner Network: Select Services Partner"
            width={600}
            height={190}
            decoding="async"
          />
        </a>
      </div>
    </aside>
  );
}
