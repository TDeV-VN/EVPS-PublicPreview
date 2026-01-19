import { StatusCodes } from "http-status-codes";
import { intersectionService } from "~/services/intersectionService";

const createIntersection = async (req, res, next) => {
  try {
    const createdIntersection = await intersectionService.createIntersection(
      req.body
    );
    res.status(StatusCodes.CREATED).json(createdIntersection);
  } catch (error) {
    next(error);
  }
};

const getIntersections = async (req, res, next) => {
  try {
    const intersections = await intersectionService.getIntersections(req.query);
    res.status(StatusCodes.OK).json(intersections);
  } catch (error) {
    next(error);
  }
};

const getIntersectionById = async (req, res, next) => {
  try {
    const { intersectionId } = req.params;
    const intersection = await intersectionService.getIntersectionById(
      intersectionId
    );
    res.status(StatusCodes.OK).json(intersection);
  } catch (error) {
    next(error);
  }
};

const getIntersectionByMac = async (req, res, next) => {
  try {
    const { mac } = req.params;
    const intersection = await intersectionService.getIntersectionByMac(mac);
    res.status(StatusCodes.OK).json(intersection);
  } catch (error) {
    next(error);
  }
};

const updateIntersectionById = async (req, res, next) => {
  try {
    const { intersectionId } = req.params;
    const updatedIntersection =
      await intersectionService.updateIntersectionById(
        intersectionId,
        req.body
      );
    res.status(StatusCodes.OK).json(updatedIntersection);
  } catch (error) {
    next(error);
  }
};

const deleteIntersectionById = async (req, res, next) => {
  try {
    const { intersectionId } = req.params;
    await intersectionService.deleteIntersectionById(intersectionId);
    res
      .status(StatusCodes.OK)
      .json({ message: "Intersection deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const intersectionController = {
  createIntersection,
  getIntersections,
  getIntersectionById,
  getIntersectionByMac,
  updateIntersectionById,
  deleteIntersectionById,
};
