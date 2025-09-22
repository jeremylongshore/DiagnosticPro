// Example test for utility functions
describe("Validation Utils", () => {
  describe("Email validation", () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it("validates correct email addresses", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.org")).toBe(true);
    });

    it("rejects invalid email addresses", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@example")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("Phone validation", () => {
    const isValidPhone = (phone: string): boolean => {
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
    };

    it("validates correct phone numbers", () => {
      expect(isValidPhone("123-456-7890")).toBe(true);
      expect(isValidPhone("(123) 456-7890")).toBe(true);
      expect(isValidPhone("+1 234 567 8900")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(isValidPhone("123")).toBe(false);
      expect(isValidPhone("abc-def-ghij")).toBe(false);
      expect(isValidPhone("")).toBe(false);
    });
  });
});
