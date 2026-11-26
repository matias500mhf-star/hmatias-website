import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const analytics = await readFile(new URL("../src/scripts/analytics.ts", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8");

test("Astro analytics is disabled unless explicitly enabled for the indexed production host", () => {
  assert.match(analytics, /PUBLIC_ANALYTICS_ENABLED === "true"/);
  assert.match(analytics, /comercialhmatiasps\.com/);
  assert.match(analytics, /noindex/i);
  assert.match(layout, /PUBLIC_ANALYTICS_ENABLED === "true" && indexingEnabled/);
});

test("GTM and all analytics events require Cookiebot statistics consent", () => {
  assert.match(analytics, /Cookiebot\?\.consent\?\.statistics/);
  assert.match(analytics, /if \(!statisticsAllowed\(\) \|\| gtmLoaded/);
  assert.match(analytics, /if \(!statisticsAllowed\(\)\) return/);
  assert.match(analytics, /CookiebotOnConsentReady/);
  assert.match(analytics, /CookiebotOnDecline/);
});

test("GTM is the only tag loader and advertising consent remains denied", () => {
  assert.match(analytics, /PUBLIC_GTM_CONTAINER_ID/);
  assert.match(analytics, /GTM-\[A-Z0-9\]/);
  assert.match(analytics, /ad_storage: "denied"/);
  assert.doesNotMatch(analytics, /googletagmanager\.com\/gtag\/js/);
  assert.doesNotMatch(analytics, /G-JNJDL6LZFY/);
});

test("analytics source contains no form-field extraction or raw query/referrer transmission", () => {
  assert.doesNotMatch(analytics, /FormData\(/);
  assert.doesNotMatch(analytics, /\.value\b/);
  assert.doesNotMatch(analytics, /page_location\s*:/);
  assert.doesNotMatch(analytics, /searchParams\.toString\(/);
  assert.match(analytics, /page_path: path/);
  assert.match(analytics, /ai_provider/);
  assert.ok(analytics.includes('emit("contact_click"'), "contact clicks must retain the shared event");
  assert.match(analytics, /contactMethod === "phone" \? "phone_click" : contactMethod === "email" \? "email_click" : "whatsapp_click"/);
  for (const eventName of ["service_click", "trust_center_click", "smart_route_click", "project_engagement", "catalogue_open", "file_download"]) {
    assert.ok(analytics.includes(`emit("${eventName}"`), `missing legacy-compatible event: ${eventName}`);
  }
});

test("confirmed lead event is separate from form submission", () => {
  assert.match(analytics, /emit\("form_submit"/);
  assert.match(analytics, /hmatias:lead-confirmed/);
  assert.match(analytics, /"generate_lead"/);
});

test("existing SOURCE AO and Smart RFQ scripts are connected to the privacy-safe analytics bridge", async () => {
  const sourceRfq = await readFile(new URL("../../../source-ao/rfq.js", import.meta.url), "utf8");
  const partnerApplication = await readFile(new URL("../../../source-ao/partner-application.js", import.meta.url), "utf8");
  const smartRfq = await readFile(new URL("../src/scripts/smart-rfq.js", import.meta.url), "utf8");
  assert.match(analytics, /hmatiasAnalytics =/);
  assert.match(analytics, /trackableEvents/);
  assert.match(analytics, /allowedParameterKeys/);
  assert.match(sourceRfq, /hmatiasAnalytics\?\.confirmLead\?\./);
  assert.match(partnerApplication, /confirmLead\?\.\('partner_application'/);
  assert.match(smartRfq, /hmatiasAnalytics\?\.track/);
});
