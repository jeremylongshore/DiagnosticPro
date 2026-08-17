import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RouteSeo } from "../RouteSeo";

describe("RouteSeo", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("sets indexable metadata and a canonical URL for public policy pages", async () => {
    render(
      <MemoryRouter initialEntries={["/privacy"]}>
        <RouteSeo />
      </MemoryRouter>
    );

    await waitFor(() => expect(document.title).toBe("Privacy Policy | DiagnosticPro"));
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index,follow"
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://diagnosticpro.io/privacy"
    );
  });

  it("canonicalizes equipment aliases while keeping them indexable", async () => {
    render(
      <MemoryRouter initialEntries={["/equipment/cars"]}>
        <RouteSeo />
      </MemoryRouter>
    );

    await waitFor(() => expect(document.title).toContain("Diagnostic Second Opinion"));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://diagnosticpro.io/equipment/automotive"
    );
  });

  it("marks transaction and unknown paths as noindex", async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/report/example"]}>
        <RouteSeo />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex,nofollow"
      )
    );

    unmount();
    render(
      <MemoryRouter initialEntries={["/missing-page"]}>
        <RouteSeo />
      </MemoryRouter>
    );
    await waitFor(() => expect(document.title).toBe("Page not found | DiagnosticPro"));
  });
});
