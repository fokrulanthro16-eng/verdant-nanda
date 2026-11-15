import { readFile, writeFile } from "node:fs/promises";

const template = await readFile("./_ref_agentic_web/skills/agentify-website/templates/network.hocon", "utf8");

const peerMatch = /"peer_rules": """([\s\S]*?)"""/.exec(template);
const partnerMatch = /"partner_rules": """([\s\S]*?)"""/.exec(template);

if (peerMatch) {
  const pr = await readFile("./partners/pineridge-stays/pineridge_stays.hocon", "utf8");
  const updatedPr = pr.replace(/"peer_rules": """[\s\S]*?"""/, '"peer_rules": """' + peerMatch[1] + '"""');
  await writeFile("./partners/pineridge-stays/pineridge_stays.hocon", updatedPr);

  const ef = await readFile("./partners/emeraldfjord-tours/emeraldfjord_tours.hocon", "utf8");
  const updatedEf = ef.replace(/"peer_rules": """[\s\S]*?"""/, '"peer_rules": """' + peerMatch[1] + '"""');
  await writeFile("./partners/emeraldfjord-tours/emeraldfjord_tours.hocon", updatedEf);

  const hub = await readFile("./hub/concierge_negotiator.hocon", "utf8");
  const hubPartner = partnerMatch[1].replace("website_<read_action>", "website_get_hub_state");
  const updatedHub = hub
    .replace(/"peer_rules": """[\s\S]*?"""/, '"peer_rules": """' + peerMatch[1] + '"""')
    .replace(/"partner_rules": """[\s\S]*?"""/, '"partner_rules": """' + hubPartner + '"""');
  await writeFile("./hub/concierge_negotiator.hocon", updatedHub);
  console.log("Successfully aligned rules with template!");
}
