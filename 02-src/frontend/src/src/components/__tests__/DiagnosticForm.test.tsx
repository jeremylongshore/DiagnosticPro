import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import DiagnosticForm from "../DiagnosticForm";

describe("DiagnosticForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom's window.alert is a no-op that logs "not implemented"; spy on it so
    // the test can assert it fired and to silence that console noise.
    jest.spyOn(window, "alert").mockImplementation(() => {});
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
    const { getByText, getByTestId } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    expect(getByText("Review")).toBeInTheDocument();
    expect(getByTestId("photo-upload-handoff")).toHaveTextContent(
      "On the next step, you can attach up to 3 photos before payment"
    );
  });

  it("calls onFormSubmit with form data when submitted with required fields", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <DiagnosticForm onFormSubmit={mockOnSubmit} />
    );

    // Fill required fields — name, email, and a problem description (the
    // backend requires symptoms OR problemDescription; the form mirrors it).
    await user.type(getByPlaceholderText("Your full name"), "John Doe");
    await user.type(getByPlaceholderText("your.email@example.com"), "john@example.com");
    await user.type(
      getByPlaceholderText(/Describe the problem in detail/),
      "engine misfires and idles rough on cold start"
    );

    // Submit
    await user.click(getByText("Review"));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "John Doe",
        email: "john@example.com",
        problemDescription: "engine misfires and idles rough on cold start",
      })
    );
  });

  it("allows submission with a symptom selected but no description (the OR branch)", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <DiagnosticForm onFormSubmit={mockOnSubmit} />
    );

    // Name + email + at least one symptom, but no free-text description — the
    // backend accepts symptoms OR problemDescription, so the gate must too.
    await user.type(getByPlaceholderText("Your full name"), "John Doe");
    await user.type(getByPlaceholderText("your.email@example.com"), "john@example.com");
    // Symptom checkboxes live behind the "Add Details" disclosure.
    await user.click(getByText(/Add Details for Better Results/));
    await user.click(getByText("Won't start"));

    await user.click(getByText("Review"));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ symptoms: expect.arrayContaining(["Won't start"]) })
    );
  });

  it("blocks submission when the problem is empty (no description, no symptoms)", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <DiagnosticForm onFormSubmit={mockOnSubmit} />
    );

    // Name + email present, but no problem description and no symptoms — this
    // is the state that previously sailed through to the Stripe step and hit a
    // raw 400 from saveSubmission.
    await user.type(getByPlaceholderText("Your full name"), "John Doe");
    await user.type(getByPlaceholderText("your.email@example.com"), "john@example.com");

    await user.click(getByText("Review"));
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });
});
