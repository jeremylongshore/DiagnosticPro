import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import DiagnosticForm from "../DiagnosticForm";

// Mock the router
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("DiagnosticForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the diagnostic form correctly", () => {
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    expect(getByText("Quick Diagnostic Assessment")).toBeInTheDocument();
    expect(getByText("Select Equipment Type")).toBeInTheDocument();
  });

  it("displays all equipment type options", () => {
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    // Check for equipment types
    expect(getByText("Heavy Equipment")).toBeInTheDocument();
    expect(getByText("Vehicles")).toBeInTheDocument();
    expect(getByText("Semi Trucks")).toBeInTheDocument();
    expect(getByText("Appliances")).toBeInTheDocument();
    expect(getByText("Power Tools")).toBeInTheDocument();
  });

  it("allows selecting an equipment type", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    const heavyEquipmentButton = getByText("Heavy Equipment");
    await user.click(heavyEquipmentButton);

    // Should show manufacturer dropdown after selection
    expect(getByText("Select Manufacturer")).toBeInTheDocument();
  });

  it("shows manufacturer options when equipment type is selected", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    // Select vehicles
    const vehiclesButton = getByText("Vehicles");
    await user.click(vehiclesButton);

    // Open manufacturer dropdown
    const manufacturerSelect = getByText("Select Manufacturer");
    await user.click(manufacturerSelect);

    // Should show vehicle manufacturers
    expect(getByText("Ford")).toBeInTheDocument();
    expect(getByText("Chevrolet")).toBeInTheDocument();
  });

  it("enables form submission when all required fields are filled", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(<DiagnosticForm onFormSubmit={mockOnSubmit} />);

    // Fill out the form
    await user.click(getByText("Vehicles"));
    await user.click(getByText("Select Manufacturer"));
    await user.click(getByText("Ford"));

    await user.type(getByPlaceholderText("Enter model name"), "F-150");
    await user.type(getByPlaceholderText("Enter year"), "2020");
    await user.type(getByPlaceholderText("Describe the problem"), "Engine noise");
    await user.type(getByPlaceholderText("Enter your email"), "test@example.com");

    const submitButton = getByText("Get AI Diagnostic Report");
    expect(submitButton).not.toBeDisabled();
  });
});
