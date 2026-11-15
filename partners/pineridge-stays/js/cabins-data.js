/**
 * PineRidge Eco-Stays Cabin Inventory & Catalog
 */

export const CabinsData = {
  SITE_NAME: "PineRidge Eco-Stays",
  LOCATION: "Blackwood Ridge Forest Reserve, Pacific Northwest",
  CONTACT: {
    concierge: "ranger@pineridge-stays.eco",
    radio_channel: "VHF-Ch14",
    phone: "+1-555-PINERDG"
  },
  CABINS: [
    {
      id: "cedar-canopy-aframe",
      name: "Cedar Canopy A-Frame",
      tagline: "Architectural timber A-frame nestled in 200-year-old western red cedars.",
      basePriceCents: 19500, // $195.00/night
      maxGuests: 4,
      beds: "1 King Loft + 1 Queen Murphy Bed",
      features: [
        "Panoramic skylight stargazing ceiling",
        "Wood-fired cedar hot tub",
        "Wrap-around forest canopy deck",
        "High-efficiency wood stove with birch logs"
      ],
      stepFree: false,
      petFriendly: true,
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "obsidian-ridge-villa",
      name: "Obsidian Ridge Villa",
      tagline: "Cantilevered basalt and blackened-steel sanctuary above the misty gorge.",
      basePriceCents: 24500, // $245.00/night
      maxGuests: 6,
      beds: "2 Kings + 2 Twin Daybeds",
      features: [
        "Floor-to-ceiling glass gorge view",
        "Outdoor sunken stone fireplace",
        "Geothermal underfloor heating",
        "Chef's kitchen with stone charcoal grill"
      ],
      stepFree: true,
      petFriendly: false,
      image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "mosswood-sanctuary",
      name: "Mosswood Sanctuary",
      tagline: "Biophilic living-roof hideaway immersed in ferns and mossy boulders.",
      basePriceCents: 16000, // $160.00/night
      maxGuests: 2,
      beds: "1 King Handcrafted Bed",
      features: [
        "Live moss living roof & indoor fern atrium",
        "Open-air rain shower under tree ferns",
        "Cedar wood-soaking tub",
        "Aromatherapy sauna cabin"
      ],
      stepFree: true,
      petFriendly: true,
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80"
    }
  ],
  EXTRAS: [
    {
      id: "terrace-bbq-package",
      name: "Panoramic Terrace BBQ & Grill Kit",
      priceCents: 4500, // $45.00
      description: "Artisan hardwood charcoal, local cedar planks, fresh herb marinade basket, and seasonal farm skewers."
    },
    {
      id: "firewood-smores-bundle",
      name: "Old-Growth Firewood & S'mores Bundle",
      priceCents: 2500, // $25.00
      description: "Two bundles of kiln-dried pine & birch, organic bean-to-bar dark chocolate, housemade vanilla marshmallows."
    },
    {
      id: "sunrise-breakfast-basket",
      name: "Organic Forest Forager Breakfast Basket",
      priceCents: 3500, // $35.00 per day
      description: "Freshly baked sourdough, huckleberry compote, pasture eggs, smoked bacon or vegan tempeh, and micro-roasted pour-over coffee."
    }
  ],
  POLICIES: {
    checkInTime: "15:00",
    checkOutTime: "11:00",
    minNights: 1,
    maxNights: 14,
    cancellation: "Free cancellation up to 7 days before check-in. 50% fee within 48 hours."
  }
};
