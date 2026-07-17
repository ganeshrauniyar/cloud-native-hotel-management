/* ═══════════════════════════════════════════════════════════════
   DOMAIN MODELS — Room, Guest, Booking, Staff, Invoice, Activity
   These mirror the frontend data shapes exactly. We keep the
   frontend's own string `id` (e.g. "room_abc123") as the primary
   lookup key so all cross-references (roomId, guestId, bookingId)
   keep working without translation.
   strict:false lets any frontend field (amenities, extras, …) pass through.
   ═══════════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

function makeModel(name) {
  const schema = new mongoose.Schema(
    {
      id: { type: String, required: true, unique: true, index: true }
    },
    { strict: false, timestamps: true, minimize: false }
  );

  // Return clean objects: expose `id`, hide Mongo internals.
  schema.set('toJSON', {
    virtuals: false,
    transform(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });

  return mongoose.model(name, schema);
}

module.exports = {
  Room: makeModel('Room'),
  Guest: makeModel('Guest'),
  Booking: makeModel('Booking'),
  Staff: makeModel('Staff'),
  Invoice: makeModel('Invoice'),
  Activity: makeModel('Activity')
};
