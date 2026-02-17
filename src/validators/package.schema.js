import { z } from "zod";

export const createPackageSchema = z.object({
  itemName: z.string().min(2),
  description: z.string().min(10),
  receiverPhone: z.string().min(7),
  deliveryTime: z.string(),
  originAddress: z.string().optional(),
  originLat: z.string().optional(),
  originLng: z.string().optional(),
  destinationAddress: z.string().optional(),
  destinationLat: z.string().optional(),
  destinationLng: z.string().optional(),
  estimatedDeliveryTime: z.string().optional(),
  distanceKm: z.string().optional(),
  // accept paused as boolean or string (from multipart/form-data)
  paused: z.union([z.boolean(), z.string()]).optional(),
  baseValue: z.string().optional(),
  shippingCost: z.string().optional(),
  currency: z.string().optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(["pending", "in-transit", "delivered", "cancelled"])
});

export const updateLocationSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

export const updatePackageSchema = createPackageSchema.partial();
