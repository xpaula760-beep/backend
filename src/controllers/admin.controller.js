 import Admin from "../models/Admin.model.js";
import bcrypt from "bcryptjs";

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin.id);

  const isMatch = await bcrypt.compare(
    currentPassword,
    admin.passwordHash
  );

  if (!isMatch) {
    return res.status(400).json({ message: "Wrong password" });
  }

  const salt = await bcrypt.genSalt(10);
  admin.passwordHash = await bcrypt.hash(newPassword, salt);
  await admin.save();

  res.json({ message: "Password updated successfully" });
};
