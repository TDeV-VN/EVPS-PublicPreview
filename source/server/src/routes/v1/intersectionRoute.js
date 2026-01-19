import express from "express";
import { intersectionController } from "~/controllers/intersectionController";
import { intersectionValidation } from "~/validations/intersectionValidation";
import { isAuthorized } from "~/middlewares/authMiddleware";

const Router = express.Router();

Router.route("/")
  .post(
    isAuthorized,
    (req, res, next) => {
      const { error } = intersectionValidation.createIntersection.validate(
        req.body
      );
      if (error) {
        return next(new Error(error.details[0].message));
      }
      next();
    },
    intersectionController.createIntersection
  )
  .get(isAuthorized, intersectionController.getIntersections);

Router.route("/mac/:mac").get(
  isAuthorized,
  (req, res, next) => {
    const { error } = intersectionValidation.getIntersectionByMac.validate(
      req.params
    );
    if (error) {
      return next(new Error(error.details[0].message));
    }
    next();
  },
  intersectionController.getIntersectionByMac
);

Router.route("/:intersectionId")
  .get(
    isAuthorized,
    (req, res, next) => {
      const { error } = intersectionValidation.getIntersection.validate(
        req.params
      );
      if (error) {
        return next(new Error(error.details[0].message));
      }
      next();
    },
    intersectionController.getIntersectionById
  )
  .patch(
    isAuthorized,
    (req, res, next) => {
      const { error } = intersectionValidation.updateIntersection.validate(
        req.body
      );
      if (error) {
        return next(new Error(error.details[0].message));
      }
      next();
    },
    intersectionController.updateIntersectionById
  )
  .delete(
    isAuthorized,
    (req, res, next) => {
      const { error } = intersectionValidation.deleteIntersection.validate(
        req.params
      );
      if (error) {
        return next(new Error(error.details[0].message));
      }
      next();
    },
    intersectionController.deleteIntersectionById
  );

export const intersectionRoute = Router;
