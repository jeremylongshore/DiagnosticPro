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

    expect(getByText(/AI diagnostic second opinion for \$4\.99/)).toBeInTheDocument();
  });

  it("shows the call-to-action button", () => {
    const { getByText, queryByText } = render(<Hero />);

    expect(getByText("Start Diagnosis - $4.99")).toBeInTheDocument();
    // Whop membership CTAs are deferred from the public UI
    expect(queryByText(/Join the Community/)).not.toBeInTheDocument();
    expect(queryByText(/Login with Whop/i)).not.toBeInTheDocument();
  });

  it("displays value summary stats", () => {
    const { getByText } = render(<Hero />);

    expect(getByText("2,000+ Words")).toBeInTheDocument();
    expect(getByText("15 Sections")).toBeInTheDocument();
    expect(getByText("$4.99")).toBeInTheDocument();
  });
});
