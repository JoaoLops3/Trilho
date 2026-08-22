import { describe, expect, it } from "vitest";
import { parseAuthDeepLinkUrl } from "./auth-deeplink";

const VALID_ACCESS = "a".repeat(120);
const VALID_REFRESH = "b".repeat(120);
const VALID_CODE = "c".repeat(40);

describe("parseAuthDeepLinkUrl", () => {
  it("aceita recovery com tokens no hash", () => {
    const result = parseAuthDeepLinkUrl(
      `https://app.example.com/nova-senha#access_token=${VALID_ACCESS}&refresh_token=${VALID_REFRESH}&type=recovery`,
    );
    expect(result).not.toBeNull();
    expect(result?.isRecovery).toBe(true);
    expect(result?.accessToken).toBe(VALID_ACCESS);
    expect(result?.refreshToken).toBe(VALID_REFRESH);
  });

  it("aceita PKCE code na query", () => {
    const result = parseAuthDeepLinkUrl(
      `capacitor://localhost/nova-senha?code=${VALID_CODE}`,
    );
    expect(result?.code).toBe(VALID_CODE);
    expect(result?.isRecovery).toBe(false);
  });

  it("rejeita URL malformada", () => {
    expect(parseAuthDeepLinkUrl("not-a-url")).toBeNull();
  });

  it("rejeita token curto ou par hash incompleto", () => {
    expect(
      parseAuthDeepLinkUrl(
        "https://app.example.com/#access_token=short&refresh_token=short",
      ),
    ).toBeNull();
    expect(
      parseAuthDeepLinkUrl(
        `https://app.example.com/#access_token=${VALID_ACCESS}`,
      ),
    ).toBeNull();
  });

  it("rejeita code implausível", () => {
    expect(
      parseAuthDeepLinkUrl("https://app.example.com/?code=abc"),
    ).toBeNull();
  });
});
