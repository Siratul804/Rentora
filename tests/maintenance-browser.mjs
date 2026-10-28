import { Builder, By } from "selenium-webdriver";
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const driver = await new Builder().forBrowser("chrome").build();

try {
  await driver.get("http://localhost:3000/login");

  console.log("Chrome browser opened.");
  console.log("Rentora te nijer TENANT account diye login koro.");

  await rl.question("Login successful hole ekhane Enter press koro...");

  await driver.get("http://localhost:3000/tenant/maintenance");
  await driver.sleep(2000);

  const url = await driver.getCurrentUrl();
  const bodyText = (
    await driver.findElement(By.css("body")).getText()
  ).toLowerCase();

  const fields = await driver.findElements(
    By.css("input, textarea, select")
  );

  const buttons = await driver.findElements(
    By.css("button, input[type='submit']")
  );

  console.log("\nCurrent URL:", url);
  console.log("Form fields found:", fields.length);
  console.log("Buttons found:", buttons.length);

  if (
    url.includes("/tenant/maintenance") &&
    (bodyText.includes("maintenance") || bodyText.includes("request"))
  ) {
    console.log("PASS | Tenant maintenance page opened after login");
  } else {
    console.log("FAIL | Page did not open as expected");
    console.log("Check login, role, and redirect behavior.");
  }

  console.log(
    fields.length > 0
      ? "PASS | Form fields found"
      : "FAIL | No form fields found"
  );

} catch (error) {
  console.error("TEST ERROR:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await driver.quit();
}
