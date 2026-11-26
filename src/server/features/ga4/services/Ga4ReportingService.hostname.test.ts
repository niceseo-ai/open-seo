import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Ga4RunReportRequest,
  Ga4RunReportResponse,
} from "@/server/lib/ga4Client";
import { makeGa4Connection } from "./ga4-test-fixtures";
import { Ga4ReportingService } from "./Ga4ReportingService";

const mocks = vi.hoisted(() => ({
  getByProjectId: vi.fn(),
  runReport:
    vi.fn<(request: Ga4RunReportRequest) => Promise<Ga4RunReportResponse>>(),
}));

vi.mock("@/server/features/ga4/repositories/Ga4ConnectionRepository", () => ({
  Ga4ConnectionRepository: { getByProjectId: mocks.getByProjectId },
}));

vi.mock("@/server/lib/ga4Client", () => ({
  createGa4DataClient: () => ({ runReport: mocks.runReport }),
}));

const connection = makeGa4Connection();

const acquisitionMetricNames = [
  "sessions",
  "activeUsers",
  "engagedSessions",
  "engagementRate",
  "keyEvents",
  "transactions",
  "purchaseRevenue",
];

describe("Ga4ReportingService hostname acquisition", () => {
  beforeEach(() => {
    mocks.getByProjectId.mockResolvedValue(connection);
  });

  it("returns hostName and integer sessions", async () => {
    mocks.runReport.mockResolvedValue({
      dimensionHeaders: [{ name: "hostName" }],
      metricHeaders: acquisitionMetricNames.map((name) => ({ name })),
      rows: [
        {
          dimensionValues: [{ value: "www.example.com" }],
          metricValues: ["12", "9", "7", "0.58", "1", "0", "0"].map(
            (value) => ({ value }),
          ),
        },
      ],
      rowCount: 1,
    });

    const result = await Ga4ReportingService.runReport(
      {
        projectId: "project_1",
        kind: "traffic_acquisition",
        acquisitionBreakdown: "hostname",
        channel: "all",
      },
      { now: new Date("2026-08-06T15:00:00Z") },
    );

    expect(mocks.runReport).toHaveBeenCalledTimes(1);
    expect(mocks.runReport.mock.calls[0]?.[0]).toMatchObject({
      dimensions: [{ name: "hostName" }],
      dimensionFilter: undefined,
      limit: "100",
      offset: "0",
    });
    expect(result.rows).toEqual([
      {
        hostName: "www.example.com",
        sessions: 12,
        activeUsers: 9,
        engagedSessions: 7,
        engagementRate: 0.58,
        keyEvents: 1,
        transactions: 0,
        purchaseRevenue: 0,
      },
    ]);
    expect(typeof result.rows[0]?.hostName).toBe("string");
    expect(Number.isInteger(result.rows[0]?.sessions)).toBe(true);
    expect(result.request).toMatchObject({
      breakdown: "hostname",
      dimensions: ["hostName"],
      channel: "all",
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.comparison).toBeUndefined();
  });

  it("rejects a previous-period comparison before calling Google", async () => {
    await expect(
      Ga4ReportingService.runReport({
        projectId: "project_1",
        kind: "traffic_acquisition",
        acquisitionBreakdown: "hostname",
        channel: "all",
        comparePreviousPeriod: true,
      }),
    ).rejects.toMatchObject({ code: "validation_error" });
    expect(mocks.runReport).not.toHaveBeenCalled();
  });
});
