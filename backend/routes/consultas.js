// routes/consultas.js
const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');

router.get('/clientes-varios-alquileres', consultaController.clientesConVariosAlquileres);
router.get('/vehiculos-mas-alquilados', consultaController.vehiculosMasAlquilados);
router.get('/alquileres-con-descuentos', consultaController.alquileresConDescuentos);
router.get('/total-recaudado', consultaController.totalRecaudado);
router.get('/clientes-multa-mayor', consultaController.clientesConMultaMayor);

module.exports = router;