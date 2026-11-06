/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "@playwright/test";

test.describe("local RPC #local", () => {
  test("blocks local RPC access from another browser origin", async ({ page }) => {
    const untrustedOrigin = "http://untrusted.localhost";
    // Allow loopback requests to reach CORS checks instead of being blocked earlier by Chromium's local-network permission.
    await page.context().grantPermissions(["local-network-access"], { origin: untrustedOrigin });
    // Serve a stand-in untrusted site without relying on an application-owned page or a separate test server.
    await page.route(`${untrustedOrigin}/`, async (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Untrusted site</title>",
      }),
    );
    await page.goto(`${untrustedOrigin}/`);

    const results = await page.evaluate(async () => {
      // text/plain keeps the POST simple, so its rejection tests the actual cross-origin request, not just preflight.
      const responses = await Promise.allSettled([
        fetch("http://127.0.0.1:3001/local-session"),
        fetch(
          "http://127.0.0.1:3001/presentation-rules-editor/v1.0/mode/1/context/none/imodel/none/changeset/0/PresentationRulesEditorRpcInterface-1.0.0-getConnectionProps",
          {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(["Baytown.bim"]),
          },
        ),
      ]);
      // CORS hides the HTTP responses from this origin, so blocked fetches reject rather than return status codes.
      return responses.map((response) => response.status);
    });
    expect(results).toEqual(["rejected", "rejected"]);
  });
});
