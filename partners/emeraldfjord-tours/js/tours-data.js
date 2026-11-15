/**
 * EmeraldFjord Expeditions Tour Catalog & Inventory
 */

export const ToursData = {
  SITE_NAME: "EmeraldFjord Expeditions",
  LOCATION: "Emerald Fjord Sound & Cascade Watershed",
  CONTACT: {
    outpost: "guide@emeraldfjord.eco",
    radio: "VHF-Ch08",
    phone: "+1-555-EMRLD-FJ"
  },
  TOURS: [
    {
      id: "midnight-kayak-expedition",
      name: "Midnight Sun & Bioluminescent Sea Kayaking",
      tagline: "Glide across glass-calm waters through phosphorescent marine fjords.",
      pricePerPersonCents: 8500, // $85.00/person
      durationHours: 3.5,
      skillLevel: "All Levels (Instruction provided)",
      maxCapacity: 12,
      equipmentIncluded: [
        "Current Designs double sea kayaks",
        "Neoprene immersion sprayskirts & booties",
        "Waterproof drybags & carbon fiber paddles",
        "Certified marine safety guides"
      ],
      departures: ["18:30", "20:30"],
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "oldgrowth-canopy-trek",
      name: "Ancient Old-Growth Canopy & Waterfall Trek",
      tagline: "Guided traverse through 800-year-old moss gardens and hidden glacial cascades.",
      pricePerPersonCents: 5500, // $55.00/person
      durationHours: 4.0,
      skillLevel: "Moderate",
      maxCapacity: 15,
      equipmentIncluded: [
        "Black Diamond trekking poles",
        "Microspikes for slippery terrain",
        "Alpine botanist trail guide"
      ],
      departures: ["09:00", "14:00"],
      image: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "electric-shuttle-transfer",
      name: "Zero-Emission Electric Shuttle Transit",
      tagline: "Clean hydro-electric van transfer connecting PineRidge Cabins and the Marina.",
      pricePerPersonCents: 1500, // $15.00/person
      durationHours: 0.5,
      skillLevel: "Comfort",
      maxCapacity: 8,
      equipmentIncluded: [
        "Luggage space for gear & coolers",
        "Heated seats & panoramic glass roof"
      ],
      departures: ["10:00", "13:00", "17:00", "19:00"],
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80"
    }
  ],
  EXTRAS: [
    {
      id: "gourmet-trail-provisions",
      name: "Artisan Nordic Trail Provisions Pack",
      priceCents: 2200, // $22.00
      description: "Smoked salmon tartine, cured venison jerky, sheep's milk cheese, dried cloudberries, and herbal fjord tea."
    },
    {
      id: "gopro-4k-rental",
      name: "Waterproof 4K Action Cam & Chest Mount",
      priceCents: 2800, // $28.00
      description: "Pre-charged GoPro with 64GB high-speed memory card for you to keep."
    }
  ],
  POLICIES: {
    weatherPolicy: "Tours operate rain or shine; free rescheduling for severe gale warnings.",
    minNoticeHours: 4,
    cancellation: "100% refund up to 24 hours prior to departure."
  }
};
