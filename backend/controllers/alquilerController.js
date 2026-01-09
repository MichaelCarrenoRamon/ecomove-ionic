// controllers/alquilerController.js
const Alquiler = require('../models/Alquiler');
const Vehiculo = require('../models/Vehiculo');
const Cliente = require('../models/Cliente');

// Calcular días entre dos fechas
const calcularDias = (fechaInicio, fechaFin) => {
  const diff = new Date(fechaFin) - new Date(fechaInicio);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Crear un alquiler
exports.crearAlquiler = async (req, res) => {
  try {
    const { clienteId, vehiculoId, fechaInicio, fechaTentativaDev } = req.body;

    // Validar que el cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Validar que el vehículo existe y está disponible
    const vehiculo = await Vehiculo.findById(vehiculoId);
    if (!vehiculo) {
      return res.status(404).json({ mensaje: 'Vehículo no encontrado' });
    }
    if (vehiculo.estado === 'alquilado') {
      return res.status(400).json({ mensaje: 'El vehículo ya está alquilado' });
    }

    // Validar edad del cliente para vehículos con restricción
    if (vehiculo.edadMinima > 0 && cliente.edad < vehiculo.edadMinima) {
      return res.status(400).json({ 
        mensaje: `El cliente no cumple con la edad mínima (${vehiculo.edadMinima} años) para alquilar este vehículo` 
      });
    }

    // Calcular días
    const dias = calcularDias(fechaInicio, fechaTentativaDev);
    if (dias <= 0) {
      return res.status(400).json({ mensaje: 'Las fechas son inválidas' });
    }

    // Calcular importe
    const importe = dias * vehiculo.tarifaDiaria;

    // Calcular descuento por uso extendido (15% si > 5 días)
    const descUsoExtendido = dias > 5 ? importe * 0.15 : 0;

    // Calcular descuento cliente frecuente (10% adicional)
    const baseParaDescFrecuente = importe - descUsoExtendido;
    const descClienteFrecuente = cliente.esFrecuente ? baseParaDescFrecuente * 0.10 : 0;

    // Calcular depósito (12% sobre el importe)
    const deposito = importe * 0.12;

    // Calcular total a pagar
    const totalPagar = importe - descUsoExtendido - descClienteFrecuente + deposito;

    // Crear el alquiler
    const nuevoAlquiler = new Alquiler({
      clienteId,
      vehiculoId,
      fechaInicio,
      fechaTentativaDev,
      dias,
      importe,
      descUsoExtendido,
      descClienteFrecuente,
      deposito,
      totalPagar,
      estado: 'activo'
    });

    await nuevoAlquiler.save();

    // Cambiar estado del vehículo a alquilado
    vehiculo.estado = 'alquilado';
    await vehiculo.save();

    res.status(201).json(nuevoAlquiler);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear alquiler', error: error.message });
  }
};

// Obtener todos los alquileres
exports.obtenerAlquileres = async (req, res) => {
  try {
    const alquileres = await Alquiler.find()
      .populate('clienteId', 'nombre apellido dni')
      .populate('vehiculoId', 'codigo nombre tarifaDiaria')
      .sort({ fechaInicio: -1 });
    res.json(alquileres);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener alquileres', error: error.message });
  }
};

// Obtener alquileres activos
exports.obtenerAlquileresActivos = async (req, res) => {
  try {
    const alquileres = await Alquiler.find({ estado: 'activo' })
      .populate('clienteId', 'nombre apellido dni')
      .populate('vehiculoId', 'codigo nombre tarifaDiaria')
      .sort({ fechaInicio: -1 });
    res.json(alquileres);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener alquileres activos', error: error.message });
  }
};

// Obtener un alquiler por ID
exports.obtenerAlquilerPorId = async (req, res) => {
  try {
    const alquiler = await Alquiler.findById(req.params.id)
      .populate('clienteId')
      .populate('vehiculoId');
    if (!alquiler) {
      return res.status(404).json({ mensaje: 'Alquiler no encontrado' });
    }
    res.json(alquiler);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener alquiler', error: error.message });
  }
};

// Devolver vehículo
exports.devolverVehiculo = async (req, res) => {
  try {
    const { fechaRealDev } = req.body;
    const alquiler = await Alquiler.findById(req.params.id).populate('vehiculoId');

    if (!alquiler) {
      return res.status(404).json({ mensaje: 'Alquiler no encontrado' });
    }

    if (alquiler.estado === 'devuelto') {
      return res.status(400).json({ mensaje: 'Este alquiler ya fue devuelto' });
    }

    // Calcular días de retraso
    const diasRetraso = calcularDias(alquiler.fechaTentativaDev, fechaRealDev);
    
    let multaRetraso = 0;
    let depositoDevuelto = alquiler.deposito;
    let totalFinal = alquiler.totalPagar;

    if (diasRetraso > 0) {
      // Multa del 10% de la tarifa diaria por cada día extra
      multaRetraso = diasRetraso * (alquiler.vehiculoId.tarifaDiaria * 0.10);
      
      // Si la multa supera el depósito, se cobra la diferencia
      if (multaRetraso > alquiler.deposito) {
        totalFinal = alquiler.totalPagar + (multaRetraso - alquiler.deposito);
        depositoDevuelto = 0;
      } else {
        depositoDevuelto = alquiler.deposito - multaRetraso;
        totalFinal = alquiler.totalPagar - depositoDevuelto;
      }
    } else {
      // No hay retraso, se devuelve el depósito completo
      depositoDevuelto = alquiler.deposito;
      totalFinal = alquiler.totalPagar - depositoDevuelto;
    }

    // Actualizar alquiler
    alquiler.fechaRealDev = fechaRealDev;
    alquiler.diasRetraso = diasRetraso > 0 ? diasRetraso : 0;
    alquiler.multaRetraso = multaRetraso;
    alquiler.depositoDevuelto = depositoDevuelto;
    alquiler.totalFinal = totalFinal;
    alquiler.estado = 'devuelto';

    await alquiler.save();

    // Cambiar estado del vehículo a disponible
    const vehiculo = await Vehiculo.findById(alquiler.vehiculoId);
    vehiculo.estado = 'disponible';
    await vehiculo.save();

    res.json(alquiler);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al devolver vehículo', error: error.message });
  }
};

// Eliminar alquiler
exports.eliminarAlquiler = async (req, res) => {
  try {
    const alquiler = await Alquiler.findById(req.params.id);
    if (!alquiler) {
      return res.status(404).json({ mensaje: 'Alquiler no encontrado' });
    }

    // Si el alquiler está activo, liberar el vehículo
    if (alquiler.estado === 'activo') {
      await Vehiculo.findByIdAndUpdate(alquiler.vehiculoId, { estado: 'disponible' });
    }

    await Alquiler.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Alquiler eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar alquiler', error: error.message });
  }
};