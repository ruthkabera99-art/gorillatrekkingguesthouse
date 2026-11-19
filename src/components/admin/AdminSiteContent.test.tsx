import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONTENT } from "@/hooks/useSiteContent";
import AdminSiteContent from "./AdminSiteContent";

const store = vi.hoisted(() => ({ fetch: vi.fn(), save: vi.fn(), success: vi.fn(), error: vi.fn(), auth: { user: { id: "signed-in-admin" } as { id: string } | null, loading: false } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => store.auth }));
vi.mock("@/hooks/useSiteContent", async (original) => ({
  ...await original<typeof import("@/hooks/useSiteContent")>(),
  fetchSiteContent: store.fetch,
  saveSiteContent: store.save,
}));
vi.mock("sonner", () => ({ toast: { success: store.success, error: store.error } }));

describe("website design editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.auth = { user: { id: "signed-in-admin" }, loading: false };
    store.fetch.mockResolvedValue(structuredClone(DEFAULT_CONTENT));
    store.save.mockImplementation(async (content) => structuredClone(content));
  });

  it("keeps a new header link in the draft until Save changes succeeds", async () => {
    render(<AdminSiteContent />);
    await screen.findByRole("button", { name: "Add link" });
    fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    const labels = screen.getAllByRole("textbox", { name: "Label — English" });
    fireEvent.change(labels.at(-1) as HTMLInputElement, { target: { value: "Guest help" } });
    expect(store.save).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: "Save changes" })[0]); });
    expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ header: expect.objectContaining({ links: expect.arrayContaining([expect.objectContaining({ label: { en: "Guest help" } })]) }) }), "signed-in-admin");
    await waitFor(() => expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled());
  });

  it("keeps unsaved changes when saving fails", async () => {
    store.save.mockRejectedValue(new Error("Permission denied"));
    render(<AdminSiteContent />);
    await screen.findByRole("button", { name: "Add link" });
    fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: "Save changes" })[0]); });
    expect(store.error).toHaveBeenCalledWith("Could not save: Permission denied");
    expect(screen.getAllByRole("button", { name: "Save changes" })[0]).toBeEnabled();
    expect(store.success).not.toHaveBeenCalled();
  });

  it("offers retry when existing settings cannot be loaded", async () => {
    store.fetch.mockRejectedValueOnce(new Error("Connection lost"));
    render(<AdminSiteContent />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("button", { name: "Add link" });
    expect(store.fetch).toHaveBeenCalledTimes(2);
  });

  it("waits for sign-in restoration before loading the saved website", async () => {
    store.auth.loading = true;
    const editor = render(<AdminSiteContent />);
    expect(store.fetch).not.toHaveBeenCalled();
    store.auth.loading = false;
    editor.rerender(<AdminSiteContent />);
    await waitFor(() => expect(store.fetch).toHaveBeenCalledTimes(1));
  });

  it("reloads the administrator's persisted draft when the editor is reopened", async () => {
    let persisted = structuredClone(DEFAULT_CONTENT);
    store.fetch.mockImplementation(async () => structuredClone(persisted));
    store.save.mockImplementation(async (content) => {
      persisted = structuredClone(content);
      return structuredClone(persisted);
    });
    const editor = render(<AdminSiteContent />);
    await screen.findByRole("button", { name: "Add link" });
    fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    const labels = screen.getAllByRole("textbox", { name: "Label — English" });
    fireEvent.change(labels.at(-1) as HTMLInputElement, { target: { value: "Guest help" } });
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: "Save changes" })[0]); });
    editor.unmount();
    render(<AdminSiteContent />);
    await waitFor(() => expect(screen.getAllByRole("textbox", { name: "Label — English" }).at(-1)).toHaveValue("Guest help"));
    expect(store.fetch).toHaveBeenCalledTimes(2);
  });
});