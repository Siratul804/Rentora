const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/tenant/maintenance`;

const tests = [
  {
    name: "MNT-API-001 Valid request",
    body: {
      title: "Automated plumbing test",
      category: "Plumbing",
      description: "Kitchen sink is leaking.",
      priority: "Medium"
    },
    expectedStatus: 201
  },
  {
    name: "MNT-API-002 Missing description",
    body: { priority: "Medium" },
    expectedStatus: 400
  },
  {
    name: "MNT-API-003 Missing priority",
    body: { description: "Test description" },
    expectedStatus: 400
  },
  {
    name: "MNT-API-004 Empty body",
    body: {},
    expectedStatus: 400
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(test.body)
    });

    const data = await response.json();
    const ok =
      response.status === test.expectedStatus &&
      data.success === (test.expectedStatus === 201);

    console.log(
      `${ok ? "PASS" : "FAIL"} | ${test.name} | HTTP ${response.status} | ${data.message || ""}`
    );

    if (ok) passed++;
    else failed++;
  } catch (error) {
    console.log(`ERROR | ${test.name} | ${error.message}`);
    failed++;
  }
}

console.log(`\nSummary: ${passed} PASS, ${failed} FAIL/ERROR`);
if (failed > 0) process.exitCode = 1;
