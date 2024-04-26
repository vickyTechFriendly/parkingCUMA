require('dotenv').config();
const axios = require('axios');
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; 

async function getOcupacion(id){
    const url = `https://eos-access.empark.com/integration/cuma/boards/occupancy/${id}`;
    try{
        const response = await axios.get(url);
        return response.data;               
    } catch(error) {
        console.error("Error en la solicitud:", error);
        throw error;
    }
}
async function getOcupacionM() {
    return getOcupacion(process.env.idM);
} 
async function getOcupacionC() {
    return getOcupacion(process.env.idC);
}
const plataforma = process.env.plataforma;

const dispositivos = [
    {
        accessToken: process.env.tokenM,
        id: process.env.idM,
        nombre: "Pablo Medina",
        totales: 0,
        libres: 0,
        ocupado: 0,
        ocupacion: 0,
    },
    {
        accessToken: process.env.tokenC,
        id: process.env.idC,
        nombre: "Catedral",
        totales: 0,
        libres: 0,
        ocupado: 0,
        ocupacion: 0,
    }
];

// Función para publicar telemetría y atributos
async function publishTelemetry(dispositivo) {
    try {
        const data = await getOcupacion(dispositivo.id);
        const [ocupadas, totales] = data.occupancy[0].split(':').map(Number);

        dispositivo.totales = totales;
        dispositivo.ocupado = ocupadas;
        dispositivo.libres = totales - ocupadas;
        dispositivo.ocupacion = (ocupadas / totales) * 100;

        const telemetryData = {
            libres: dispositivo.libres,
            ocupado: dispositivo.ocupado,
            ocupacion: dispositivo.ocupacion,
        };

        await axios.post(`https://${process.env.plataforma}/api/v1/${dispositivo.accessToken}/telemetry`, telemetryData, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const attributeData = {
            totales: dispositivo.totales,
        };

        await axios.post(`https://${process.env.plataforma}/api/v1/${dispositivo.accessToken}/attributes`, attributeData, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`¡Datos de ${dispositivo.nombre} enviados correctamente como telemetría y atributos!`);
    } catch (error) {
        console.error(`Error al enviar los datos de ${dispositivo.nombre}:`, error.message);
    }
}

// Inicialización de la carga de datos cada 5 minutos
dispositivos.forEach(dispositivo => { 
    console.log(`Iniciando la carga de datos telemétricos de ${dispositivo.nombre} cada 5 minutos...`);
    publishTelemetry(dispositivo);
    setInterval(() => { 
        console.log(`Recargando datos de ${dispositivo.nombre}...`);
        publishTelemetry(dispositivo);
    }, 300000); 
});