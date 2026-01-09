// routes/alquileres.js
const express = require('express');
const router = express.Router();
const alquilerController = require('../controllers/alquilerController');

router.get('/', alquilerController.obtenerAlquileres);
router.get('/activos', alquilerController.obtenerAlquileresActivos);
router.get('/:id', alquilerController.obtenerAlquilerPorId);
router.post('/', alquilerController.crearAlquiler);
router.put('/:id/devolver', alquilerController.devolverVehiculo);
router.delete('/:id', alquilerController.eliminarAlquiler);

module.exports = router;