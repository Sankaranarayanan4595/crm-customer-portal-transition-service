const mongoose = require('mongoose');

module.exports = function(connection) {
  if (!connection) throw new Error('connection is required for AutoIncrement');

  const CounterSchema = new mongoose.Schema({
    id: { type: String, required: true },
    reference_value: { type: mongoose.Schema.Types.Mixed },
    seq: { type: Number, default: 1, required: true }
  }, {
    collection: 'counters',
    versionKey: false,
    _id: false
  });

  CounterSchema.index({ id: 1, reference_value: 1 }, { unique: true });

  let CounterModel;
  try {
    CounterModel = connection.model('Counter_CustomSequence');
  } catch (err) {
    CounterModel = connection.model('Counter_CustomSequence', CounterSchema);
  }

  return function (schema, options) {
    const incField = options.inc_field;
    const id = options.id || incField;
    const startSeq = options.start_seq || 1;
    const incAmount = options.inc_amount || 1;

    if (!schema.path(incField)) {
      let f = {};
      f[incField] = 'Number';
      schema.add(f);
    }

    schema.pre('save', function (next) {
      if (!this.isNew) return next();

      CounterModel.findOneAndUpdate(
        { id: id, reference_value: null },
        { $setOnInsert: { seq: startSeq - incAmount } },
        { new: true, upsert: true }
      ).then(() => {
        return CounterModel.findOneAndUpdate(
          { id: id, reference_value: null },
          { $inc: { seq: incAmount } },
          { new: true }
        );
      }).then(counter => {
        this[incField] = counter.seq;
        next();
      }).catch(err => {
        next(err);
      });
    });
  };
};
