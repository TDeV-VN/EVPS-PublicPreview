import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const createIntersection = Joi.object({
  name: Joi.string().required().trim().strict(),
  mac: Joi.string().required().trim().strict(),
  pillars: Joi.array()
    .items(
      Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
        groupId: Joi.string().required(),
        espGroupPin: Joi.string().allow(null, "").optional(),
        description: Joi.string().allow(null, ""),
      })
    )
    .min(1)
    .required(),
});

const updateIntersection = Joi.object({
  name: Joi.string().trim().strict(),
  mac: Joi.string().trim().strict(),
  pillars: Joi.array().items(
    Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
      groupId: Joi.string().required(),
      espGroupPin: Joi.string().allow(null, "").optional(),
      description: Joi.string().allow(null, ""),
    })
  ),
});

const getIntersection = Joi.object({
  intersectionId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
});

const getIntersectionByMac = Joi.object({
  mac: Joi.string().required().trim().strict(),
});

const deleteIntersection = Joi.object({
  intersectionId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
});

export const intersectionValidation = {
  createIntersection,
  updateIntersection,
  getIntersection,
  getIntersectionByMac,
  deleteIntersection,
};
