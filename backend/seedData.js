// seedData.js - Ejecutar con: node seedData.js
const mongoose = require('mongoose');
require('dotenv').config();

const Vehiculo = require('./models/Vehiculo');
const Cliente = require('./models/Cliente');

const vehiculosIniciales = [
  {
    codigo: 'V01',
    nombre: 'Scooter Eléctrico',
    tarifaDiaria: 25,
    edadMinima: 18,
    estado: 'disponible'
  },
  {
    codigo: 'V02',
    nombre: 'Bicicleta Eléctrica',
    tarifaDiaria: 35,
    edadMinima: 0,
    estado: 'disponible'
  },
  {
    codigo: 'V03',
    nombre: 'Monopatín Eléctrico',
    tarifaDiaria: 20,
    edadMinima: 0,
    estado: 'disponible'
  },
  {
    codigo: 'V04',
    nombre: 'Moto Eléctrica',
    tarifaDiaria: 30,
    edadMinima: 18,
    estado: 'disponible'
  }
];

const clientesIniciales = [
  {
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    edad: 25,
    email: 'juan.perez@email.com',
    telefono: '987654321',
    esFrecuente: true
  },
  {
    nombre: 'María',
    apellido: 'García',
    dni: '87654321',
    edad: 30,
    email: 'maria.garcia@email.com',
    telefono: '987654322',
    esFrecuente: false
  },
  {
    nombre: 'Carlos',
    apellido: 'López',
    dni: '11223344',
    edad: 22,
    email: 'carlos.lopez@email.com',
    telefono: '987654323',
    esFrecuente: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colecciones existentes
    await Vehiculo.deleteMany({});
    await Cliente.deleteMany({});
    console.log('🗑️  Colecciones limpiadas');

    // Insertar vehículos
    await Vehiculo.insertMany(vehiculosIniciales);
    console.log('✅ Vehículos insertados');

    // Insertar clientes
    await Cliente.insertMany(clientesIniciales);
    console.log('✅ Clientes insertados');

    console.log('🎉 Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedDatabase();