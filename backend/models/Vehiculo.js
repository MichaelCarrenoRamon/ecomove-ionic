// models/Vehiculo.js
const mongoose = require('mongoose');

const vehiculoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true
  },
  tarifaDiaria: {
    type: Number,
    required: true,
    min: 0
  },
  edadMinima: {
    type: Number,
    required: true,
    default: 0
  },
  estado: {
    type: String,
    enum: ['disponible', 'alquilado'],
    default: 'disponible'
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehiculo', vehiculoSchema);