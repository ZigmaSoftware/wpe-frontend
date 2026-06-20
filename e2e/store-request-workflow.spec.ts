import { expect, test } from "@playwright/test";

const isoNow = "2026-06-18T12:00:00.000Z";

const createWorkflowRequest = () => ({
  id: 1,
  request_no: "SR-00000001",
  item: 101,
  item_code: "RM-101",
  item_name: "Virgin LDPE",
  category: "Raw Material",
  group: "Polymer",
  sub_group: "LDPE",
  unit: "kg",
  quantity: "10.000",
  request_type: "GENERAL" as const,
  department: "Compounding",
  request_date: "2026-06-18",
  require_date: "2026-06-19",
  require_time: "10:00:00",
  requested_for_name: "Shift Lead",
  request_reason: "Batch requirement",
  status: "PENDING_HEAD_APPROVAL" as "PENDING_HEAD_APPROVAL" | "PENDING_REQUEST_PROCESS" | "PENDING_STOCK_RELEASE" | "CLOSED_WON",
  requested_by: 1,
  requested_by_username: "requestor",
  approved_by: null as number | null,
  approved_by_username: null as string | null,
  processed_by: null as number | null,
  processed_by_username: null as string | null,
  processed_at: null as string | null,
  released_by: null as number | null,
  released_by_username: null as string | null,
  released_at: null as string | null,
  head_action_by: null as number | null,
  head_action_by_username: null as string | null,
  head_action_at: null as string | null,
  head_approval_remarks: null as string | null,
  requested_at: isoNow,
  approved_at: null as string | null,
  total_requested_qty: "10.000",
  total_approved_qty: "0.000",
  total_issued_qty: "0.000",
  items: [
    {
      id: 11,
      item: 101,
      item_code: "RM-101",
      item_name: "Virgin LDPE",
      category: "Raw Material",
      group: "Polymer",
      sub_group: "LDPE",
      unit: "kg",
      requested_qty: "10.000",
      approved_qty: "0.000",
      issued_qty: "0.000",
      available_qty: "50.000",
      shortage_qty: "0.000",
      remarks: null,
      created_at: isoNow,
      updated_at: isoNow,
    },
  ],
});

const success = (data: unknown, message = "OK") => ({
  success: true,
  message,
  data,
});

const paginated = (rows: unknown[]) => success({ count: rows.length, next: null, previous: null, results: rows });

test("store request workflow moves through head approval, request process, release stock, and closed won", async ({ page }) => {
  const requestState = createWorkflowRequest();

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "wpe.auth",
      JSON.stringify({
        tokens: {
          access: "test-access",
          refresh: "test-refresh",
        },
        user: {
          id: 999,
          username: "store-admin",
          is_staff: true,
          department_name: "Compounding",
        },
      }),
    );
  });

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/")) {
      await route.continue();
      return;
    }
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/api/auth/me/" && method === "GET") {
      await route.fulfill({ json: { id: 999, username: "store-admin", is_staff: true, department_name: "Compounding" } });
      return;
    }

    if (path === "/api/users/user-permissions/menu/" && method === "GET") {
      await route.fulfill({ json: [] });
      return;
    }

    if (path === "/api/users/user-permissions/resolved/" && method === "GET") {
      await route.fulfill({ json: {} });
      return;
    }

    if (path === "/api/wpe-masters/departments/lookup/" && method === "GET") {
      await route.fulfill({ json: [{ value: 1, label: "Compounding" }] });
      return;
    }

    if (path === "/api/blending/store-requests/" && method === "GET") {
      await route.fulfill({ json: paginated([requestState]) });
      return;
    }

    if (path === "/api/blending/head-approvals/" && method === "GET") {
      await route.fulfill({
        json: paginated(requestState.status === "PENDING_HEAD_APPROVAL" ? [requestState] : []),
      });
      return;
    }

    if (path === "/api/blending/head-approvals/1/approve/" && method === "POST") {
      requestState.status = "PENDING_REQUEST_PROCESS";
      requestState.approved_by = 201;
      requestState.approved_by_username = "dept-head";
      requestState.head_action_by = 201;
      requestState.head_action_by_username = "dept-head";
      requestState.head_action_at = isoNow;
      requestState.approved_at = isoNow;
      await route.fulfill({ json: success(requestState) });
      return;
    }

    if (path === "/api/store/requests/" && method === "GET") {
      const queue = url.searchParams.get("queue");
      const rows =
        queue === "request_process"
          ? requestState.status === "PENDING_REQUEST_PROCESS"
            ? [requestState]
            : []
          : queue === "release_stock"
            ? requestState.status === "PENDING_STOCK_RELEASE"
              ? [requestState]
              : []
            : queue === "closed_won"
              ? requestState.status === "CLOSED_WON"
                ? [requestState]
                : []
              : [requestState];
      await route.fulfill({ json: paginated(rows) });
      return;
    }

    if (path === "/api/store/requests/1/approve/" && method === "POST") {
      requestState.status = "PENDING_STOCK_RELEASE";
      requestState.processed_by = 301;
      requestState.processed_by_username = "store-processor";
      requestState.processed_at = isoNow;
      requestState.total_approved_qty = "8.000";
      requestState.items[0].approved_qty = "8.000";
      await route.fulfill({ json: success({ request: requestState, source_stocks: [], destination_stocks: [], issue_transactions: [], receipt_transactions: [] }) });
      return;
    }

    if (path === "/api/store/requests/1/release/" && method === "POST") {
      requestState.status = "CLOSED_WON";
      requestState.released_by = 302;
      requestState.released_by_username = "store-releaser";
      requestState.released_at = isoNow;
      requestState.total_issued_qty = "8.000";
      requestState.items[0].issued_qty = "8.000";
      await route.fulfill({ json: success({ request: requestState, source_stocks: [], destination_stocks: [], issue_transactions: [], receipt_transactions: [] }) });
      return;
    }

    if (path === "/api/store/inventory/summary/" && method === "GET") {
      await route.fulfill({ json: paginated([]) });
      return;
    }

    if (path === "/api/store/transactions/" && method === "GET") {
      await route.fulfill({ json: paginated([]) });
      return;
    }

    await route.fulfill({ json: success({}) });
  });

  await page.goto("/app/requests/store-request");
  await expect(page.getByRole("heading", { name: "Store Request" })).toBeVisible();
  await expect(page.getByText("SR-00000001")).toBeVisible();
  await expect(page.getByTitle("Edit request")).toBeEnabled();
  await expect(page.getByTitle("Delete request")).toBeEnabled();

  await page.goto("/app/requests/head-approval");
  await expect(page.getByRole("heading", { name: "Head Approval's" })).toBeVisible();
  await page.getByTitle("Approve").click();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Request approved.")).toBeVisible();

  await page.goto("/app/requests/store-request");
  await expect(page.getByTitle("Edit request")).toBeDisabled();
  await expect(page.getByTitle("Delete request")).toBeDisabled();

  await page.goto("/app/store/request-process");
  await expect(page.getByRole("heading", { name: "Request Process" })).toBeVisible();
  await page.locator("button", { hasText: "Open" }).click();
  await page.getByLabel("Process Qty").fill("8");
  await page.getByRole("button", { name: "Process" }).click();
  await expect(page.getByText("Request processed.")).toBeVisible();

  await page.goto("/app/store/release-stock");
  await expect(page.getByRole("heading", { name: "Release Stock" })).toBeVisible();
  await page.getByTitle("Release request").click();
  await page.getByRole("button", { name: "Release" }).click();
  await expect(page.getByText("Request released.")).toBeVisible();

  await page.goto("/app/store/closed-won");
  await expect(page.getByRole("heading", { name: "Closed Won" })).toBeVisible();
  await expect(page.getByText("SR-00000001")).toBeVisible();
  await expect(page.getByText("store-releaser")).toBeVisible();
});
