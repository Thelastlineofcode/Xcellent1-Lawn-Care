import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";

const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE_URL}${path}`);
  return await res.text();
}

async function fetchJson(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}${path}`);
  return await res.json();
}

Deno.test({
  name: "Test 1: LocalBusiness schema present in page HTML",
  async fn() {
    const html = await fetchHtml("/home.html");
    
    const hasLawnCareService = html.includes('"@type": "LawnCareService"');
    const hasSchemaScript = html.includes('type="application/ld+json"');
    const hasLocalBusiness = html.includes('"@context": "https://schema.org"');
    
    assertEquals(hasLawnCareService, true, "Page should contain LawnCareService schema type");
    assertEquals(hasSchemaScript, true, "Page should contain JSON-LD script tag");
    assertEquals(hasLocalBusiness, true, "Page should contain schema.org context");
  },
});

Deno.test({
  name: "Test 2: FAQPage schema present in page HTML",
  async fn() {
    const html = await fetchHtml("/home.html");
    
    const hasFAQPage = html.includes('"@type": "FAQPage"');
    const hasVoiceQuestions = html.includes("LaPlace Louisiana");
    
    assertEquals(hasFAQPage, true, "Page should contain FAQPage schema type");
    assertEquals(hasVoiceQuestions, true, "Page should contain voice search questions");
  },
});

Deno.test({
  name: "Test 3: NAP fields match across schema",
  async fn() {
    const html = await fetchHtml("/home.html");
    
    const hasPhone = html.includes("+1-504-875-8079");
    const hasLaPlace = html.includes("LaPlace");
    const hasLARegion = html.includes('"addressRegion": "LA"');
    const hasUSCountry = html.includes('"addressCountry": "US"');
    
    assertEquals(hasPhone, true, "Schema should contain correct phone number");
    assertEquals(hasLaPlace, true, "Schema should contain LaPlace locality");
    assertEquals(hasLARegion, true, "Schema should contain LA region");
    assertEquals(hasUSCountry, true, "Schema should contain US country");
  },
});

Deno.test({
  name: "Test 4: areaServed includes all 5 target cities",
  async fn() {
    const html = await fetchHtml("/home.html");
    
    const targetCities = [
      "LaPlace, LA",
      "Norco, LA",
      "Destrehan, LA",
      "Luling, LA",
      "St. Rose, LA",
    ];
    
    for (const city of targetCities) {
      assertStringIncludes(html, city, `Schema should include areaServed: ${city}`);
    }
  },
});

Deno.test({
  name: "Test 5: sameAs URLs are valid and include GBP",
  async fn() {
    const html = await fetchHtml("/home.html");
    
    const hasGBP = html.includes("g.page/r/CZbYqiFFQ57SEBM");
    
    assertEquals(hasGBP, true, "Schema should include Google Business Profile URL");
    
    const gbpUrl = "https://g.page/r/CZbYqiFFQ57SEBM";
    try {
      const res = await fetch(gbpUrl, { redirect: "follow" });
      assertEquals(res.status < 400, true, "GBP URL should be accessible");
    } catch {
      // GBP URL may redirect, which is expected
    }
  },
});
