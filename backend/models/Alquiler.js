// models/Alquiler.js
const mongoose = require('mongoose');

const alquilerSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  vehiculoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehiculo',
    required: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaTentativaDev: {
    type: Date,
    required: true
  },
  fechaRealDev: {
    type: Date,
    default: null
  },
  dias: {
    type: Number,
    required: true
  },
  importe: {
    type: Number,
    required: true
  },
  descUsoExtendido: {
    type: Number,
    default: 0
  },
  descClienteFrecuente: {
    type: Number,
    default: 0
  },
  deposito: {
    type: Number,
    required: true
  },
  totalPagar: {
    type: Number,
    required: true
  },
  diasRetraso: {
    type: Number,
    default: 0
  },
  multaRetraso: {
    type: Number,
    default: 0
  },
  depositoDevuelto: {
    type: Number,
    default: 0
  },
  totalFinal: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ['activo', 'devuelto'],
    default: 'activo'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alquiler', alquilerSchema);