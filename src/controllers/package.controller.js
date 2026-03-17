import Package from "../models/Package.model.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { estimateFlightEta } from "../services/package.service.js";

/* Helper to upload buffer */
const uploadFromBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "packages", resource_type: "auto", ...options },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const toCloudinaryAsset = (uploaded) => ({
  public_id: uploaded.public_id,
  secure_url: uploaded.secure_url,
  resource_type: uploaded.resource_type,
  format: uploaded.format,
  duration: uploaded.duration,
  bytes: uploaded.bytes
});

const normalizeMediaList = (media = []) =>
  media.map((asset) => {
    if (!asset) return asset;
    if (typeof asset === "string") return { secure_url: asset };
    return asset;
  });

const normalizeItemList = (items = [], fallbackItemName) => {
  let normalized = items;

  if ((!normalized || !normalized.length) && fallbackItemName) {
    normalized = [{ name: fallbackItemName }];
  }

  if (normalized && typeof normalized === "string") {
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) normalized = parsed;
    } catch (e) {
      normalized = normalized.split(",").map((s) => ({ name: s.trim() }));
    }
  }

  if (!Array.isArray(normalized)) return normalized;

  return normalized.map((it) => {
    if (!it) return it;
    if (typeof it === "string") return { name: it, images: [] };
    const obj = { ...it };
    obj.images = normalizeMediaList(obj.images || []);
    return obj;
  });
};

const normalizePackageOutput = (pkg) => {
  const out = pkg?.toObject ? pkg.toObject() : pkg;
  if (!out) return out;

  out.images = normalizeMediaList(out.images || []);
  out.videos = normalizeMediaList(out.videos || []);
  out.items = normalizeItemList(out.items, out.itemName);

  return out;
};

export const createPackage = async (req, res) => {
  const {
    itemName,
    items,
    description,
    receiverPhone,
    deliveryTime,
    originAddress,
    originLat,
    originLng,
    destinationAddress,
    destinationLat,
    destinationLng,
    currentLat,
    currentLng,
    paused,
    estimatedDeliveryTime,
    distanceKm,
    packageValue,
    currency
  } = req.body;

  // handle multipart files: package-level images/videos and per-item files named 'itemImage-<index>'
  const packageImages = [];
  const packageVideos = [];
  const itemFilesMap = {}; // index -> array of uploaded file objects
  if (req.files && req.files.length) {
    for (const file of req.files) {
      const fld = file.fieldname || "";
      const m = fld.match(/^itemImage-(\d+)$/);
      if (m) {
        const uploaded = await uploadFromBuffer(file.buffer, { folder: "packages/items" });
        const idx = Number(m[1]);
        itemFilesMap[idx] = itemFilesMap[idx] || [];
        itemFilesMap[idx].push(toCloudinaryAsset(uploaded));
      } else if (fld === "videos" || String(file.mimetype || "").startsWith("video/")) {
        const uploaded = await uploadFromBuffer(file.buffer, { folder: "packages/videos" });
        packageVideos.push(toCloudinaryAsset(uploaded));
      } else {
        const uploaded = await uploadFromBuffer(file.buffer, { folder: "packages/images" });
        packageImages.push(toCloudinaryAsset(uploaded));
      }
    }
  }

  // allow caller to pass existing package-level image URLs
  if (req.body.existingImages) {
    try {
      const parsed = typeof req.body.existingImages === 'string' ? JSON.parse(req.body.existingImages) : req.body.existingImages;
      if (Array.isArray(parsed)) {
        for (const it of parsed) {
          if (!it) continue;
          if (typeof it === 'string') packageImages.unshift({ secure_url: it });
          else if (typeof it === 'object' && it.secure_url) packageImages.unshift(it);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  if (req.body.existingVideos) {
    try {
      const parsed = typeof req.body.existingVideos === 'string' ? JSON.parse(req.body.existingVideos) : req.body.existingVideos;
      if (Array.isArray(parsed)) {
        for (const it of parsed) {
          if (!it) continue;
          if (typeof it === 'string') packageVideos.unshift({ secure_url: it, resource_type: 'video' });
          else if (typeof it === 'object' && it.secure_url) packageVideos.unshift(it);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  const packageData = {
    itemName,
    // accept items as JSON array (objects) or fallback to itemName string
    items: (() => {
      if (!items) return undefined;
      if (Array.isArray(items)) return items;
      if (typeof items === "string") {
        try {
          const parsed = JSON.parse(items);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          // not JSON, fall back to single-name list
          return items.split(",").map((s) => ({ name: s.trim() })).filter(Boolean);
        }
      }
      return undefined;
    })(),
    description,
    receiverPhone,
    deliveryTime: deliveryTime ? new Date(deliveryTime) : undefined,
    images: packageImages,
    videos: packageVideos
  };

  // generate a simple tracking number if not provided
  const genTrackingNumber = () => {
    return (
      "PKG" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    );
  };

  packageData.trackingNumber = genTrackingNumber();

  if (originAddress || originLat || originLng) {
    packageData.origin = {
      address: originAddress || undefined,
      lat: originLat ? Number(originLat) : undefined,
      lng: originLng ? Number(originLng) : undefined
    };
  }

  if (destinationAddress || destinationLat || destinationLng) {
    packageData.destination = {
      address: destinationAddress || undefined,
      lat: destinationLat ? Number(destinationLat) : undefined,
      lng: destinationLng ? Number(destinationLng) : undefined
    };
  }

  if (currentLat || currentLng) {
    packageData.currentLocation = {
      lat: currentLat ? Number(currentLat) : undefined,
      lng: currentLng ? Number(currentLng) : undefined,
      updatedAt: new Date()
    };
  }

  if (typeof paused !== "undefined") {
    packageData.paused = paused === "true" || paused === true;
  }

  if (estimatedDeliveryTime) {
    packageData.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
  }

  if (distanceKm) {
    packageData.distanceKm = Number(distanceKm);
  }

  if (typeof req.body.baseValue !== 'undefined' || typeof packageValue !== 'undefined') {
    // accept both baseValue (new) and packageValue (legacy)
    const bv = typeof req.body.baseValue !== 'undefined' ? req.body.baseValue : req.body.packageValue || packageValue;
    packageData.baseValue = Number(bv);
  }

  packageData.currency = currency || "USD";
  if (typeof req.body.shippingCost !== 'undefined') {
    packageData.shippingCost = Number(req.body.shippingCost);
  }

  // If we have origin and destination coords, compute distance and ETA (use deliveryTime as start if provided)
  const oLat = packageData.origin?.lat;
  const oLng = packageData.origin?.lng;
  const dLat = packageData.destination?.lat;
  const dLng = packageData.destination?.lng;
  if (oLat && oLng && dLat && dLng) {
    const start = deliveryTime ? new Date(deliveryTime) : Date.now();
    const { distanceKm: calcDistance, eta } = estimateFlightEta({ originLat: oLat, originLng: oLng, destinationLat: dLat, destinationLng: dLng, startTime: start });
    packageData.distanceKm = calcDistance;
    packageData.estimatedDeliveryTime = eta;
  }

  // attach per-item images from uploaded files or existingItemImages mapping
  if (packageData.items && Array.isArray(packageData.items)) {
    // parse existingItemImages if provided (object keyed by index -> [urls])
    let existingItemImages = {};
    if (req.body.existingItemImages) {
      try {
        existingItemImages = typeof req.body.existingItemImages === 'string' ? JSON.parse(req.body.existingItemImages) : req.body.existingItemImages;
      } catch (e) {
        existingItemImages = {};
      }
    }

    packageData.items = packageData.items.map((it, idx) => {
      const base = typeof it === 'string' ? { name: it } : it || {};
      const imgs = [];
      // existing URLs for this item
      if (existingItemImages && Array.isArray(existingItemImages[idx])) {
        for (const u of existingItemImages[idx]) imgs.push(typeof u === 'string' ? { secure_url: u } : u);
      }
      // uploaded files mapped to this index
      if (itemFilesMap[idx] && itemFilesMap[idx].length) {
        for (const f of itemFilesMap[idx]) imgs.push(f);
      }
      if (imgs.length) base.images = imgs;
      return base;
    });
  }

  const newPackage = await Package.create(packageData);

  res.status(201).json(newPackage);
};

export const getPackages = async (req, res) => {
  const list = await Package.find().sort({ createdAt: -1 });
  res.json(list.map((pkg) => normalizePackageOutput(pkg)));
};

export const getPackageByTrackingNumber = async (req, res) => {
  const tn = req.params.trackingNumber;
  const pkg = await Package.findOne({ trackingNumber: tn });
  if (!pkg) return res.status(404).json({ message: "Not found" });
  res.json(normalizePackageOutput(pkg));
};

export const getPackageById = async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) return res.status(404).json({ message: "Not found" });
  res.json(normalizePackageOutput(pkg));
};

export const updateStatus = async (req, res) => {
  const { status } = req.body;

  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(pkg);
};

export const updateLocation = async (req, res) => {
  const { lat, lng } = req.body;

  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    {
      currentLocation: {
        lat,
        lng,
        updatedAt: new Date()
      }
    },
    { new: true }
  );

  res.json(pkg);
};

export const clearLocation = async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { $unset: { currentLocation: "" } },
    { new: true }
  );

  res.json(pkg);
};

export const deletePackage = async (req, res) => {
  await Package.findByIdAndDelete(req.params.id);
  res.json({ message: "Package deleted" });
};

export const updatePackage = async (req, res) => {
  const id = req.params.id;
  const pkg = await Package.findById(id);
  if (!pkg) return res.status(404).json({ message: "Not found" });

  const {
    itemName,
    items,
    description,
    receiverPhone,
    deliveryTime,
    originAddress,
    originLat,
    originLng,
    destinationAddress,
    destinationLat,
    destinationLng,
    currentLat,
    currentLng,
    paused,
    estimatedDeliveryTime,
    distanceKm,
    baseValue,
    shippingCost,
    currency
  } = req.body;

  if (typeof itemName !== 'undefined') pkg.itemName = itemName;
  if (typeof items !== 'undefined') {
    if (Array.isArray(items)) pkg.items = items;
    else if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) pkg.items = parsed;
        else pkg.items = items.split(",").map(s => s.trim()).filter(Boolean);
      } catch (e) {
        pkg.items = items.split(",").map(s => s.trim()).filter(Boolean);
      }
    }
  }
  if (typeof description !== 'undefined') pkg.description = description;
  if (typeof receiverPhone !== 'undefined') pkg.receiverPhone = receiverPhone;
  if (deliveryTime) pkg.deliveryTime = new Date(deliveryTime);
  if (typeof paused !== 'undefined') pkg.paused = paused === 'true' || paused === true;
  if (estimatedDeliveryTime) pkg.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
  if (distanceKm) pkg.distanceKm = Number(distanceKm);
  if (typeof req.body.baseValue !== 'undefined' || typeof baseValue !== 'undefined') {
    const bv = typeof req.body.baseValue !== 'undefined' ? req.body.baseValue : baseValue;
    pkg.baseValue = Number(bv);
  }
  if (typeof req.body.shippingCost !== 'undefined' || typeof shippingCost !== 'undefined') {
    const sc = typeof req.body.shippingCost !== 'undefined' ? req.body.shippingCost : shippingCost;
    pkg.shippingCost = Number(sc);
  }
  if (currency) pkg.currency = currency;

  if (originAddress || originLat || originLng) {
    pkg.origin = {
      address: originAddress || pkg.origin?.address,
      lat: originLat ? Number(originLat) : pkg.origin?.lat,
      lng: originLng ? Number(originLng) : pkg.origin?.lng
    };
  }

  if (destinationAddress || destinationLat || destinationLng) {
    pkg.destination = {
      address: destinationAddress || pkg.destination?.address,
      lat: destinationLat ? Number(destinationLat) : pkg.destination?.lat,
      lng: destinationLng ? Number(destinationLng) : pkg.destination?.lng
    };
  }

  if (currentLat || currentLng) {
    pkg.currentLocation = {
      lat: currentLat ? Number(currentLat) : pkg.currentLocation?.lat,
      lng: currentLng ? Number(currentLng) : pkg.currentLocation?.lng,
      updatedAt: new Date()
    };
  }

  // handle uploaded images (replace if provided)
  // If files uploaded, they were already processed in create flow; here we need to map by fieldname
  const newUploadedImages = [];
  const newUploadedVideos = [];
  const newItemFilesMap = {};
  if (req.files && req.files.length) {
    for (const file of req.files) {
      const fld = file.fieldname || "";
      const m = fld.match(/^itemImage-(\d+)$/);
      if (m) {
        const uploaded = await uploadFromBuffer(file.buffer, { folder: "packages/items" });
        const idx = Number(m[1]);
        newItemFilesMap[idx] = newItemFilesMap[idx] || [];
        newItemFilesMap[idx].push(toCloudinaryAsset(uploaded));
      } else if (fld === "videos" || String(file.mimetype || "").startsWith("video/")) {
        const uploaded = await uploadFromBuffer(file.buffer, { folder: "packages/videos" });
        newUploadedVideos.push(toCloudinaryAsset(uploaded));
      } else {
        const uploaded = await uploadFromBuffer(file.buffer, { folder: "packages/images" });
        newUploadedImages.push(toCloudinaryAsset(uploaded));
      }
    }
  }

  // existingImages sent from frontend (array of URLs or objects)
  let keepImages = [];
  if (req.body.existingImages) {
    try {
      const parsed = typeof req.body.existingImages === 'string' ? JSON.parse(req.body.existingImages) : req.body.existingImages;
      if (Array.isArray(parsed)) {
        keepImages = parsed.map((it) => (typeof it === 'string' ? { secure_url: it } : it));
      }
    } catch (e) {
      keepImages = [];
    }
  }

  if (newUploadedImages.length || keepImages.length) {
    pkg.images = [...keepImages, ...newUploadedImages];
  }

  let keepVideos = [];
  if (req.body.existingVideos) {
    try {
      const parsed = typeof req.body.existingVideos === 'string' ? JSON.parse(req.body.existingVideos) : req.body.existingVideos;
      if (Array.isArray(parsed)) {
        keepVideos = parsed.map((it) => (typeof it === 'string' ? { secure_url: it, resource_type: 'video' } : it));
      }
    } catch (e) {
      keepVideos = [];
    }
  }

  if (newUploadedVideos.length || keepVideos.length) {
    pkg.videos = [...keepVideos, ...newUploadedVideos];
  }

  // existingItemImages mapping (index -> [urls])
  let existingItemImages = {};
  if (req.body.existingItemImages) {
    try {
      existingItemImages = typeof req.body.existingItemImages === 'string' ? JSON.parse(req.body.existingItemImages) : req.body.existingItemImages;
    } catch (e) {
      existingItemImages = {};
    }
  }

  // If items supplied or existing pkg.items, merge images per-item
  const resultingItems = Array.isArray(pkg.items) ? pkg.items.slice() : [];
  if (resultingItems.length || Object.keys(newItemFilesMap).length || Object.keys(existingItemImages).length) {
    for (let idx = 0; idx < resultingItems.length; idx++) {
      const base = typeof resultingItems[idx] === 'string' ? { name: resultingItems[idx] } : resultingItems[idx] || {};
      const imgs = [];
      if (existingItemImages && Array.isArray(existingItemImages[idx])) {
        for (const u of existingItemImages[idx]) imgs.push(typeof u === 'string' ? { secure_url: u } : u);
      }
      if (newItemFilesMap[idx] && newItemFilesMap[idx].length) {
        for (const f of newItemFilesMap[idx]) imgs.push(f);
      }
      if (imgs.length) base.images = imgs;
      resultingItems[idx] = base;
    }
    pkg.items = resultingItems;
  }

  // recompute distance/ETA if origin/destination coords available
  const oLat = pkg.origin?.lat;
  const oLng = pkg.origin?.lng;
  const dLat = pkg.destination?.lat;
  const dLng = pkg.destination?.lng;
  if (oLat && oLng && dLat && dLng) {
    const start = pkg.deliveryTime ? new Date(pkg.deliveryTime) : Date.now();
    const { distanceKm: calcDistance, eta } = estimateFlightEta({ originLat: oLat, originLng: oLng, destinationLat: dLat, destinationLng: dLng, startTime: start });
    pkg.distanceKm = calcDistance;
    pkg.estimatedDeliveryTime = eta;
  }

  await pkg.save();
  res.json(normalizePackageOutput(pkg));
};
