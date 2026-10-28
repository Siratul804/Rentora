
import { Builder } from "selenium-webdriver";

const driver = await new Builder()
  .forBrowser("chrome")
  .build();

try {
  await driver.get("http://localhost:3000");

  console.log("Page title:", await driver.getTitle());
  console.log("Current URL:", await driver.getCurrentUrl());

  console.log("Selenium smoke test PASSED!");
} catch (error) {
  console.error("Selenium test FAILED:", error);
  process.exitCode = 1;
} finally {
  await driver.quit();
}
