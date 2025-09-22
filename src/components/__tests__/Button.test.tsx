import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Button } from "../ui/button";

describe("Button Component", () => {
  it("renders button with text", () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);

    const button = getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);

    const button = getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it("applies variant classes correctly", () => {
    const { rerender, getByRole } = render(<Button variant="destructive">Delete</Button>);
    let button = getByRole("button", { name: /delete/i });
    expect(button.className).toContain("destructive");

    rerender(<Button variant="outline">Outline</Button>);
    button = getByRole("button", { name: /outline/i });
    expect(button.className).toContain("outline");
  });
});
