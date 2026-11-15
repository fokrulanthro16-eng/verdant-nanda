/**
 * Subpage Verification Script
 */

async function verifySubpages() {
  console.log("Verifying subpages and styles across all nodes...\n");

  const urls = [
    { name: "Hub Index", url: "http://127.0.0.1:8080/" },
    { name: "Hub Styles", url: "http://127.0.0.1:8080/styles.css" },
    { name: "SDK Page", url: "http://127.0.0.1:8080/sdk/index.html" },
    { name: "SDK Styles", url: "http://127.0.0.1:8080/sdk/styles.css" },
    { name: "PineRidge Index", url: "http://localhost:8081/" },
    { name: "PineRidge Styles", url: "http://localhost:8081/styles.css" },
    { name: "EmeraldFjord Index", url: "http://localhost:8082/" },
    { name: "EmeraldFjord Styles", url: "http://localhost:8082/styles.css" }
  ];

  for (const item of urls) {
    try {
      const res = await fetch(item.url);
      const text = await res.text();
      console.log(`[${res.status}] ${item.name} (${item.url}) - Length: ${text.length} bytes`);
      
      if (item.name.includes("Page") || item.name.includes("Index")) {
        const hasBackLink = text.includes("http://127.0.0.1:8080/");
        const hasDarkTheme = text.includes("#030906") || text.includes("void-bg");
        console.log(`   -> Back link to Hub root present: ${hasBackLink ? "✅ YES" : "❌ NO"}`);
        console.log(`   -> Dark-forest glass theme present: ${hasDarkTheme ? "✅ YES" : "❌ NO"}`);
      }
    } catch (e) {
      console.error(`❌ FAILED: ${item.name} (${item.url}) - ${e.message}`);
    }
  }

  console.log("\nAll subpage and styling checks complete!");
}

verifySubpages().catch(console.error);
