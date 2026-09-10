const mongoose = require("mongoose");

const bookingNightSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

bookingNightSchema.index({ listing: 1, date: 1 }, { unique: true });
bookingNightSchema.index({ booking: 1 });

module.exports = mongoose.model("BookingNight", bookingNightSchema);
