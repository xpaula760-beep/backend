import Package from "../models/Package.model.js";

export const createPackageService = async (data) => {
  return await Package.create(data);
};

export const getPackageByIdService = async (id) => {
  return await Package.findById(id);
};

export const updatePackageStatusService = async (id, status) => {
  return await Package.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};

export const updatePackageLocationService = async (id, location) => {
  return await Package.findByIdAndUpdate(
    id,
    {
      currentLocation: {
        ...location,
        updatedAt: new Date()
      }
    },
    { new: true }
  );
};

export const clearPackageLocationService = async (id) => {
  return await Package.findByIdAndUpdate(id, { $unset: { currentLocation: "" } }, { new: true });
};

export const deletePackageService = async (id) => {
  return await Package.findByIdAndDelete(id);
};

// Calculate great-circle distance (Haversine) in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate flight time and ETA given origin/destination coords and a start time.
// Uses an average cruise speed (km/h). Returns { distanceKm, eta }
export function estimateFlightEta({ originLat, originLng, destinationLat, destinationLng, startTime = Date.now(), avgSpeedKmph = 800 }) {
  const distance = calculateDistanceKm(Number(originLat), Number(originLng), Number(destinationLat), Number(destinationLng));
  const hours = distance / avgSpeedKmph;
  const eta = new Date(new Date(startTime).getTime() + Math.round(hours * 3600 * 1000));
  return { distanceKm: Math.round(distance * 100) / 100, eta };
}
