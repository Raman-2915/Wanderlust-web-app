const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.string().allow("", null),
    category: Joi.string()
      .valid("trending", "private-home", "city", "nature", "waterfront", "getaway")
      .required(),
    maxGuests: Joi.number().integer().min(1).required(),
    bedrooms: Joi.number().integer().min(0).required(),
    beds: Joi.number().integer().min(0).required(),
    bathrooms: Joi.number().min(0).required(),
    amenities: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).default([]),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});
