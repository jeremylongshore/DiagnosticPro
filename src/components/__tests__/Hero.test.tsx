import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hero from "../Hero";

describe("Hero Component", () => {
  it("renders hero section with main heading", () => {
    const { getByText } = render(<Hero />);

    expect(getByText("Professional AI Diagnostic Reports")).toBeInTheDocument();
  });

  it("displays the value proposition", () => {
    const { getByText } = render(<Hero />);

    expect(getByText(/Get instant, comprehensive diagnostic analysis/)).toBeInTheDocument();
  });

  it("shows the call-to-action button", () => {
    const { getByText } = render(<Hero />);

    const ctaButton = getByText("Start Your Diagnostic");
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton.closest("a")).toHaveAttribute("href", "#diagnostic-form");
  });

  it("displays the hero image", () => {
    const { getByAltText } = render(<Hero />);

    const heroImage = getByAltText("Professional diagnostic equipment analysis");
    expect(heroImage).toBeInTheDocument();
  });
});
