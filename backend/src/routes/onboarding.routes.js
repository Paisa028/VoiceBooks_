
const { Router } = require("express");

const {
  authenticate,
} = require("../middleware/auth.js");

const {
  validate,
} = require("../middleware/validate.js");

const {
  completeOnboarding,
  findRowById,
  setSageStatus,
  toPublic,
} = require("../models/accounts.js");

const {
  sageSchema,
} = require("../validators/auth.schemas.js");

const router = Router();

// All onboarding endpoints require authentication.
router.use(authenticate);

// Only Business Owners can configure Sage.
router.put(
  "/sage",
  validate(sageSchema),
  async (req, res, next) => {
    try {
      if (req.user.role !== "business_owner") {
        return res.status(403).json({
          message:
            "Only Business Owners can manage Sage integration.",
        });
      }

      const { action, region } = req.body;

      if (action === "connect") {
        await setSageStatus(
          req.user.id,
          "pending",
          region
        );

        return res.json({
          message:
            "Sage connection setup started. Authentication is still required.",
          status: "pending",
          connected: false,
        });
      }

      if (action === "skip") {
        await setSageStatus(
          req.user.id,
          "skipped"
        );

        return res.json({
          message: "Sage setup skipped.",
          status: "skipped",
          connected: false,
        });
      }

      return res.status(400).json({
        message: "Invalid Sage setup action.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// All authenticated roles can complete onboarding.
router.post(
  "/complete",
  async (req, res, next) => {
    try {
      const existingUser = await findRowById(req.user.id);

      if (!existingUser) {
        return res.status(404).json({
          message: "User account not found.",
        });
      }

      await completeOnboarding(req.user.id);

      const updatedUser = await findRowById(req.user.id);

      if (!updatedUser) {
        return res.status(404).json({
          message: "User account not found after onboarding.",
        });
      }

      const user = toPublic(updatedUser);

      return res.json({
        message: "Onboarding complete.",
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
