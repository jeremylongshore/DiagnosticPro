import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hero from "../Hero";

describe("Hero Component", () => {
  it("renders hero section with main heading", () => {
    const { getByText } = render(<Hero />);

    expect(getByText("Know What's Wrong")).toBeInTheDocument();
    expect(getByText("Before You Authorize Repairs")).toBeInTheDocument();
  });

  it("displays the value proposition", () => {
    const { getByText } = render(<Hero />);

    expect(getByText(/A second opinion on your repair, for \$4\.99/)).toBeInTheDocument();
  });

  it("shows the call-to-action button", () => {
    const { getByText, queryByText } = render(<Hero />);

    expect(getByText("Start Diagnosis - $4.99")).toBeInTheDocument();
    expect(queryByText(/Join the Community/)).not.toBeInTheDocument();
    expect(queryByText(/Login with Whop/i)).not.toBeInTheDocument();
  });

  it("displays value summary stats", () => {
    const { getByText } = render(<Hero />);

    // Deliberately NOT a word count: length reads as homework, not value.
    expect(getByText("Questions to Ask")).toBeInTheDocument();
    expect(getByText("15 Sections")).toBeInTheDocument();
    // Price appears in CTA and stats row
    expect(getByText("Start Diagnosis - $4.99")).toBeInTheDocument();
  });
});
