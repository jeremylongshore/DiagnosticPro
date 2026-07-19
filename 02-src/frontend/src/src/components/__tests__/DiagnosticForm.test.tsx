import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import DiagnosticForm from "../DiagnosticForm";

describe("DiagnosticForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the diagnostic form correctly", () => {
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    expect(getByText("Diagnosis")).toBeInTheDocument();
    expect(getByText("What type of equipment?")).toBeInTheDocument();
    expect(getByText("Basic information")).toBeInTheDocument();
  });

  it("displays all equipment type options", () => {
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    expect(getByText("Cars & SUVs")).toBeInTheDocument();
    expect(getByText("Gas Trucks")).toBeInTheDocument();
    expect(getByText("Diesel Trucks")).toBeInTheDocument();
    expect(getByText("Semi Trucks")).toBeInTheDocument();
    expect(getByText("Motorcycles")).toBeInTheDocument();
    expect(getByText("Power Tools")).toBeInTheDocument();
    expect(getByText("HVAC")).toBeInTheDocument();
    expect(getByText("Marine")).toBeInTheDocument();
  });

  it("allows selecting an equipment type", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    await user.click(getByText("Cars & SUVs"));

    // Should show make/model/year selects after selection
    expect(getByText("Make")).toBeInTheDocument();
    expect(getByText("Model")).toBeInTheDocument();
    expect(getByText("Year")).toBeInTheDocument();
  });

  it("renders the review button", () => {
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    expect(getByText("Review")).toBeInTheDocument();
  });

  it("calls onFormSubmit with form data when submitted with required fields", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <DiagnosticForm onFormSubmit={mockOnSubmit} />
    );

    // Fill required fields
    await user.type(getByPlaceholderText("Your full name"), "John Doe");
    await user.type(getByPlaceholderText("your.email@example.com"), "john@example.com");

    // Submit
    await user.click(getByText("Review"));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "John Doe",
        email: "john@example.com",
      })
    );
  });
});
