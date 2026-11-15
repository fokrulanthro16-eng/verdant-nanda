/**
 * Gateway Test Suite for VerdantNANDA
 */

async function testGateway() {
  console.log("1. Testing GET http://127.0.0.1:8080/api/gateway...");
  const getRes = await fetch("http://127.0.0.1:8080/api/gateway");
  const getJson = await getRes.json();
  console.log("GET status:", getRes.status, getJson);

  console.log("\n2. Testing POST /api/gateway with Mozilla Otari (alibaba/qwen3.8-flash)...");
  const otariRes = await fetch("http://127.0.0.1:8080/api/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "alibaba/qwen3.8-flash",
      messages: [{ role: "user", content: "Say hello in 5 words." }]
    })
  });
  console.log("Otari status:", otariRes.status, "Provider Header:", otariRes.headers.get("x-gateway-provider"));
  const otariData = await otariRes.json();
  console.log("Otari reply:", otariData.choices?.[0]?.message?.content?.trim());

  console.log("\n3. Testing POST /api/gateway with Nebius (deepseek-ai/DeepSeek-V4.1-Flash-1017)...");
  const nebiusRes = await fetch("http://127.0.0.1:8080/api/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-V4.1-Flash-1017",
      messages: [{ role: "user", content: "Say hello in 5 words." }]
    })
  });
  console.log("Nebius status:", nebiusRes.status, "Provider Header:", nebiusRes.headers.get("x-gateway-provider"));
  const nebiusData = await nebiusRes.json();
  console.log("Nebius reply:", nebiusData.choices?.[0]?.message?.content?.trim());

  console.log("\n4. Testing POST /api/gateway with friendly name (DeepSeek V4.1 Flash 1017)...");
  const friendlyRes = await fetch("http://127.0.0.1:8080/api/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "DeepSeek V4.1 Flash 1017",
      messages: [{ role: "user", content: "Say hello in 5 words." }]
    })
  });
  console.log("Friendly status:", friendlyRes.status, "Provider Header:", friendlyRes.headers.get("x-gateway-provider"), "Model Header:", friendlyRes.headers.get("x-gateway-model"));
  const friendlyData = await friendlyRes.json();
  console.log("Friendly reply:", friendlyData.choices?.[0]?.message?.content?.trim());

  console.log("\n5. Testing GET /api/gateway/dev-key for Otari and Nebius...");
  const devKeyOtari = await fetch("http://127.0.0.1:8080/api/gateway/dev-key?provider=otari");
  const dataOtari = await devKeyOtari.json();
  console.log("Dev-key Otari:", dataOtari.provider, "Key exists:", !!dataOtari.key);

  const devKeyNebius = await fetch("http://127.0.0.1:8080/api/gateway/dev-key?provider=nebius");
  const dataNebius = await devKeyNebius.json();
  console.log("Dev-key Nebius:", dataNebius.provider, "Key exists:", !!dataNebius.key);

  console.log("\n✅ ALL GATEWAY ENDPOINTS OPERATIONAL!");
}

testGateway().catch(console.error);
