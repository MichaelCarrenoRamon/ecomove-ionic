// controllers/consultaController.js
const Alquiler = require('../models/Alquiler');
const mongoose = require('mongoose');

// 1. Clientes que alquilaron más de un vehículo
exports.clientesConVariosAlquileres = async (req, res) => {
  try {
    const resultado = await Alquiler.aggregate([
      {
        $group: {
          _id: '$clienteId',
          totalAlquileres: { $sum: 1 },
          alquileres: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          totalAlquileres: { $gt: 1 }
        }
      },
      {
        $lookup: {
          from: 'clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'cliente'
        }
      },
      {
        $unwind: '$cliente'
      },
      {
        $project: {
          _id: 1,
          nombre: '$cliente.nombre',
          apellido: '$cliente.apellido',
          dni: '$cliente.dni',
          totalAlquileres: 1
        }
      },
      {
        $sort: { totalAlquileres: -1 }
      }
    ]);
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en la consulta', error: error.message });
  }
};

// 2. Vehículos más alquilados
exports.vehiculosMasAlquilados = async (req, res) => {
  try {
    const resultado = await Alquiler.aggregate([
      {
        $group: {
          _id: '$vehiculoId',
          totalAlquileres: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'vehiculos',
          localField: '_id',
          foreignField: '_id',
          as: 'vehiculo'
        }
      },
      {
        $unwind: '$vehiculo'
      },
      {
        $project: {
          _id: 1,
          codigo: '$vehiculo.codigo',
          nombre: '$vehiculo.nombre',
          tarifaDiaria: '$vehiculo.tarifaDiaria',
          totalAlquileres: 1
        }
      },
      {
        $sort: { totalAlquileres: -1 }
      }
    ]);
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en la consulta', error: error.message });
  }
};

// 3. Alquileres con descuento de cliente frecuente y uso extendido
exports.alquileresConDescuentos = async (req, res) => {
  try {
    const resultado = await Alquiler.find({
      descUsoExtendido: { $gt: 0 },
      descClienteFrecuente: { $gt: 0 }
    })
      .populate('clienteId', 'nombre apellido dni')
      .populate('vehiculoId', 'codigo nombre')
      .sort({ fechaInicio: -1 });
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en la consulta', error: error.message });
  }
};

// 4. Total recaudado por ECO-MOVE (importe neto + depósitos + multas)
exports.totalRecaudado = async (req, res) => {
  try {
    const resultado = await Alquiler.aggregate([
      {
        $group: {
          _id: null,
          totalImporte: { $sum: '$importe' },
          totalDescuentos: { 
            $sum: { 
              $add: ['$descUsoExtendido', '$descClienteFrecuente'] 
            } 
          },
          totalDepositos: { $sum: '$deposito' },
          totalMultas: { $sum: '$multaRetraso' },
          totalAlquileres: { $sum: 1 },
          alquileresActivos: {
            $sum: {
              $cond: [{ $eq: ['$estado', 'activo'] }, 1, 0]
            }
          },
          alquileresDevueltos: {
            $sum: {
              $cond: [{ $eq: ['$estado', 'devuelto'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalImporte: 1,
          totalDescuentos: 1,
          importeNeto: { $subtract: ['$totalImporte', '$totalDescuentos'] },
          totalDepositos: 1,
          totalMultas: 1,
          totalRecaudado: {
            $add: [
              { $subtract: ['$totalImporte', '$totalDescuentos'] },
              '$totalDepositos',
              '$totalMultas'
            ]
          },
          totalAlquileres: 1,
          alquileresActivos: 1,
          alquileresDevueltos: 1
        }
      }
    ]);
    
    res.json(resultado[0] || {
      totalImporte: 0,
      totalDescuentos: 0,
      importeNeto: 0,
      totalDepositos: 0,
      totalMultas: 0,
      totalRecaudado: 0,
      totalAlquileres: 0,
      alquileresActivos: 0,
      alquileresDevueltos: 0
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en la consulta', error: error.message });
  }
};

// 5. Clientes que devolvieron tarde y pagaron multa mayor al depósito
exports.clientesConMultaMayor = async (req, res) => {
  try {
    const resultado = await Alquiler.aggregate([
      {
        $match: {
          estado: 'devuelto',
          diasRetraso: { $gt: 0 },
          $expr: { $gt: ['$multaRetraso', '$deposito'] }
        }
      },
      {
        $lookup: {
          from: 'clientes',
          localField: 'clienteId',
          foreignField: '_id',
          as: 'cliente'
        }
      },
      {
        $unwind: '$cliente'
      },
      {
        $lookup: {
          from: 'vehiculos',
          localField: 'vehiculoId',
          foreignField: '_id',
          as: 'vehiculo'
        }
      },
      {
        $unwind: '$vehiculo'
      },
      {
        $project: {
          _id: 1,
          cliente: {
            nombre: '$cliente.nombre',
            apellido: '$cliente.apellido',
            dni: '$cliente.dni'
          },
          vehiculo: {
            codigo: '$vehiculo.codigo',
            nombre: '$vehiculo.nombre'
          },
          fechaInicio: 1,
          fechaTentativaDev: 1,
          fechaRealDev: 1,
          diasRetraso: 1,
          deposito: 1,
          multaRetraso: 1,
          diferenciaPagada: { $subtract: ['$multaRetraso', '$deposito'] },
          totalFinal: 1
        }
      },
      {
        $sort: { multaRetraso: -1 }
      }
    ]);
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en la consulta', error: error.message });
  }
};