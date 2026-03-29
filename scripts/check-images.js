import { connectDB } from "../src/config/db.js";
import Package from "../src/models/Package.model.js";

const tn = process.argv[2];
if (!tn) {
  console.error("Usage: node scripts/check-images.js <TRACKING_NUMBER>");
  process.exit(1);
}

const run = async () => {
  await connectDB();
  const pkg = await Package.findOne({ trackingNumber: tn });
  if (!pkg) {
    console.error("Package not found for tracking number:", tn);
    process.exit(2);
  }

  const pkgObj = pkg.toObject ? pkg.toObject() : pkg;
  const packageImages = Array.isArray(pkgObj.images) ? pkgObj.images.filter(Boolean) : [];
  let itemImagesCount = 0;
  if (Array.isArray(pkgObj.items)) {
    for (const it of pkgObj.items) {
      if (!it) continue;
      const imgs = Array.isArray(it.images) ? it.images.filter(Boolean) : [];
      itemImagesCount += imgs.length;
    }
  }

  console.log("Tracking number:", tn);
  console.log("Package-level images:", packageImages.length);
  console.log("Per-item images total:", itemImagesCount);
  console.log("Total images:", packageImages.length + itemImagesCount);
  // Optional: list urls
  if (packageImages.length) {
    console.log("Package images list:");
    packageImages.forEach((i, idx) => console.log(idx + 1, i.secure_url || i.public_id || JSON.stringify(i)));
  }
  if (itemImagesCount) {
    console.log("Item images breakdown:");
    pkgObj.items.forEach((it, idx) => {
      const imgs = Array.isArray(it.images) ? it.images.filter(Boolean) : [];
      if (imgs.length) {
        console.log(` Item ${idx}: ${imgs.length}`);
        imgs.forEach((i, j) => console.log(`  - ${i.secure_url || i.public_id || JSON.stringify(i)}`));
      }
    });
  }

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
