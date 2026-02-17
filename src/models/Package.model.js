import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true
    },

    trackingNumber: {
      type: String,
      unique: true,
      index: true
    },

    description: {
      type: String,
      required: true
    },

    receiverPhone: {
      type: String,
      required: true
    },

    deliveryTime: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "in-transit", "delivered", "cancelled"],
      default: "pending"
    },

    images: [
      {
        public_id: String,
        secure_url: String
      }
    ],

    items: [
      {
        name: { type: String, required: true, trim: true },
        description: String,
        value: { type: Number, required: true, default: 0 },
        images: [
          {
            public_id: String,
            secure_url: String
          }
        ]
      }
    ],

    origin: {
      lat: Number,
      lng: Number,
      address: String
    },

    destination: {
      lat: Number,
      lng: Number,
      address: String
    },

    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    },

    paused: {
      type: Boolean,
      default: false
    },

    estimatedDeliveryTime: Date,

    distanceKm: Number,

    baseValue: {
      type: Number,
      required: true,
      default: 0
    },

    totalValue: {
      type: Number,
      default: 0
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "USD"
    }
  },
  { timestamps: true }
);
// Recalculate totalValue before saving: baseValue + sum(items.value)
PackageSchema.pre("save", function (next) {
  try {
    const itemsTotal = (this.items || []).reduce((sum, it) => sum + (it.value || 0), 0);
    this.totalValue = (this.baseValue || 0) + itemsTotal;
  } catch (err) {
    this.totalValue = this.baseValue || 0;
  }
  next();
});

export default mongoose.model("Package", PackageSchema);
