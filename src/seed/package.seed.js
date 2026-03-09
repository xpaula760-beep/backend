import { connectDB } from "../config/db.js";
import Package from "../models/Package.model.js";

const seed = async () => {
  await connectDB();

  const pkgData = {
    trackingNumber: "PKG-ITALY-USA-300K",
    itemName: "High-Value Luxury Shipment",
    description: "International air shipment containing luxury watch, diamond jewelry, and fine art. High insurance value, priority handling required.",
    receiverPhone: "+1-212-555-0198",
    status: "in-transit",
    paused: false,
    deliveryTime: new Date("2026-02-10T18:00:00Z"),
    origin: {
      address: "Via Monte Napoleone, 20121 Milan, Italy",
      lat: 45.4685,
      lng: 9.1824
    },
    destination: {
      address: "350 5th Ave, New York, NY 10118, USA",
      lat: 40.7484,
      lng: -73.9857
    },
    currentLocation: {
      lat: 48.0,
      lng: -25.0
    },
    distanceKm: 6450,
    estimatedDeliveryTime: new Date("2026-02-09T22:30:00Z"),
    images: [
      { public_id: "demo/watch", secure_url: "https://res.cloudinary.com/daiii0a2n/image/upload/v1769910209/images_c9xrar.jpg" },
      { public_id: "demo/jewelry", secure_url: "https://res.cloudinary.com/daiii0a2n/image/upload/v1769910368/1_s61eg5.jpg" },
      { public_id: "demo/art", secure_url: "https://res.cloudinary.com/daiii0a2n/image/upload/v1769910369/81y3uG8IUaL._AC_UF894_1000_QL80__gxiony.jpg" }
    ],
    baseValue: 300000,
    currency: "USD",
    items: [
      { name: "Luxury Swiss Watch", description: "Limited edition Swiss mechanical watch, insured.", value: 120000 },
      { name: "Diamond Necklace", description: "18k white gold necklace with certified diamonds.", value: 100000 },
      { name: "Contemporary Art Painting", description: "Original artwork by European contemporary artist.", value: 80000 }
    ]
  };

  // Upsert by trackingNumber to avoid duplicates
  const existing = await Package.findOne({ trackingNumber: pkgData.trackingNumber });
  if (existing) {
    Object.assign(existing, pkgData);
    await existing.save();
    console.log("Updated package with tracking number:", pkgData.trackingNumber);
  } else {
    await Package.create(pkgData);
    console.log("Seeded package with tracking number:", pkgData.trackingNumber);
  }

  // Additional seed provided by user
  const packageSeed = {
    itemName: "Electronics & Fashion Package",

    trackingNumber: "DFT9382746FRUS",

    description:
      "International shipment containing electronics and clothing items from France warehouse to Miami Beach customer.",

    receiverPhone: "+13055542198",

    deliveryTime: new Date("2026-03-25T16:00:00Z"),

    status: "in-transit",

    origin: {
      lat: 45.8029719,
      lng: 3.169343,
      address: "ZAC des Gravanches, 63370 Malintrat, France"
    },

    destination: {
      lat: 25.798778,
      lng: -80.127191,
      address: "2301 Collins Ave APT 325, Miami Beach, FL 33139, USA"
    },

    currentLocation: {
      lat: 40.712776,
      lng: -74.005974,
      updatedAt: new Date()
    },

    paused: false,

    estimatedDeliveryTime: new Date("2026-03-25T16:00:00Z"),

    distanceKm: 7345,

    baseValue: 250,

    shippingCost: 120,

    currency: "USD",

    items: [
      {
        name: "Apple MacBook Pro 14-inch",
        description: "Laptop with M3 chip and 16GB RAM",
        value: 2100,
        images: [
          {
            public_id: "packages/macbook1",
            secure_url:
              "https://res.cloudinary.com/demo/image/upload/macbook.jpg"
          }
        ]
      },
      {
        name: "Louis Vuitton Leather Wallet",
        description: "Premium leather wallet from Paris boutique",
        value: 650,
        images: [
          {
            public_id: "packages/wallet1",
            secure_url:
              "https://res.cloudinary.com/demo/image/upload/wallet.jpg"
          }
        ]
      },
      {
        name: "Nike Air Max Sneakers",
        description: "Limited edition sneakers",
        value: 180,
        images: [
          {
            public_id: "packages/shoes1",
            secure_url:
              "https://res.cloudinary.com/demo/image/upload/shoes.jpg"
          }
        ]
      }
    ],

    images: [
      {
        public_id: "packages/box1",
        secure_url:
          "https://res.cloudinary.com/demo/image/upload/box.jpg"
      }
    ]
  };

  const existing2 = await Package.findOne({ trackingNumber: packageSeed.trackingNumber });
  if (existing2) {
    Object.assign(existing2, packageSeed);
    await existing2.save();
    console.log('Updated package with tracking number:', packageSeed.trackingNumber);
  } else {
    await Package.create(packageSeed);
    console.log('Seeded package with tracking number:', packageSeed.trackingNumber);
  }

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
