import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLogin from "./AdminLogin";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signInWithPhone: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ signIn: mocks.signIn, signInWithPhone: mocks.signInWithPhone }),
}));

function renderLogin() {
  return render(<HelmetProvider><MemoryRouter><AdminLogin /></MemoryRouter></HelmetProvider>);
}

function submit(identifier: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email or WhatsApp number"), { target: { value: identifier } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in to Admin Panel" }));
}

describe("AdminLogin", () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
    mocks.signInWithPhone.mockReset();
  });

  it("signs an administrator in with their email and password", async () => {
    mocks.signIn.mockResolvedValue({ error: null });
    renderLogin();

    submit("admin@example.com", "secret123");

    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith("admin@example.com", "secret123"));
    expect(mocks.signInWithPhone).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Checking staff access…" })).toBeDisabled();
  });

  it("uses WhatsApp authentication when the identifier is not an email", async () => {
    mocks.signInWithPhone.mockResolvedValue({ error: null });
    renderLogin();

    submit("+250 788 123 456", "secret123");

    await waitFor(() => expect(mocks.signInWithPhone).toHaveBeenCalledWith("+250 788 123 456", "secret123"));
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("keeps the form available and explains rejected credentials", async () => {
    mocks.signIn.mockResolvedValue({ error: new Error("Invalid login credentials") });
    renderLogin();

    submit("admin@example.com", "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("The email or WhatsApp number and password do not match.");
    expect(screen.getByRole("button", { name: "Sign in to Admin Panel" })).toBeEnabled();
    expect(mocks.signInWithPhone).not.toHaveBeenCalled();
  });
});
