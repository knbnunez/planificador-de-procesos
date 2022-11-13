// IMPORTS
const fs = require('fs');
const Proceso = require('./models');

// Para modularizar en el futuro
const planificaciones = require('./prueba');



// Definición de variables a usar
let cantProcesos = 0;
//
let colaNuevos = [];
let colaListos = [];
let colaCorriendo = []; // Siempre habrá 1 sólo proceso
let colaBloqueados = [];
let colaTerminados = [];
//
let tiempo = 0;
//

// Puede ser útil armar colas de 1na posición para TIP, TCP y TFP...

let tip = 0;            // Tiempo de Inicio de Proceso (TIP) + Lo ingresa el usuario
let tcp = 0;            // Tiempo de Conmutación entre Procesos (TCP) + Lo ingresa el usuario
let tfp = 0;            // Tiempo de Finalización de Proceso (TFP) + Lo ingresa el usuario
//
let tCpuDesocupada = 0; // Ningún proceso en cpu o uso de SO
let tUsoSo = 0;         // Computo de TIP, TCP y TFP
let tUsoCpu = 0;        // Ejecución efectiva de cpu por los procesos
//
let quantum = 0;        // Lo ingresa el usuario

// Funciones de planificación
function fcfs() {
    // console.log('Dentro de FCFS');

    if ((colaCorriendo.length > 0) && (colaCorriendo[0].tComputoParcialCpu < colaCorriendo[0].tRafagaCpu)) {
        ejecutarRafaga();

    } else if ((colaCorriendo.length > 0) && (colaCorriendo[0].tComputoParcialCpu == colaCorriendo[0].tRafagaCpu)) {
        // Ejecuto TCP si no tiene que ejecutar TFP
        if (colaCorriendo[0].tComputoTotalES < colaCorriendo[0].tESTotal) ejecutarTcp();
        else ejecutarTfp();
    } 

    // Caso Cpu libre y procesos en cola listos
    if ((colaCorriendo.length == 0) && (colaListos.length > 0)) {
        // Asignar Cpu
        let procesoACorrer = colaListos.shift();
        colaCorriendo.push(procesoACorrer);
        
        // Caso primera vez que ejecuta
        if ((tip > 0) && (colaCorriendo[0].tComputoTotalCpu == 0)) ejecutarTip();
        else fcfs(); // Vuelvo a entrar para computar uso de Cpu

    }
    
}


// Me parece que falta un desasignarCpu()
function pe() {
    // console.log('Dentro de PE');
    // let masPrioritarioColaListos = null;

    // Si hay procesos en cola listos, puede que haya un proceso con mayor prioridad que el que está corriendo || o simplemente calculo la prioridad 
    if (colaListos.length > 0) masPrioritarioColaListos = getMayorPrioridad(); // Obj Proceso
    console.log({masPrioritarioColaListos});

    if (colaCorriendo.length > 0) console.log(colaCorriendo[0]);

    if (
        (colaCorriendo.length > 0) 
        && (colaCorriendo[0].tComputoParcialCpu < colaCorriendo[0].tRafagaCpu) 
        && (colaCorriendo[0].prioridad <= masPrioritarioColaListos.prioridad)
    ) ejecutarRafaga(); // A MAYOR VALOR de prioridad, MENOR JERARQUÍA (prioridad) tiene el proceso...
    //
    else if (
        (colaCorriendo.length > 0) 
        && (colaCorriendo[0].tComputoParcialCpu < colaCorriendo[0].tRafagaCpu) 
        && (colaCorriendo[0].prioridad > masPrioritarioColaListos.prioridad)
    ) { 
        colaCorriendo[0].fuePausado = true;
        ejecutarTcp();
    }
    //
    else if ((colaCorriendo.length > 0) && (colaCorriendo[0].tComputoParcialCpu == colaCorriendo[0].tRafagaCpu)) {
        //
        colaCorriendo[0].fuePausado = false;
        if (colaCorriendo[0].tComputoTotalES < colaCorriendo[0].tESTotal) ejecutarTcp();
        
        // Está entrando acá y no debería...
        else ejecutarTfp();
    }

    // Caso Cpu libre y procesos en cola listos
    if ((colaCorriendo.length == 0) && (colaListos.length > 0)) {
        // Asignar Cpu
        // let procesoACorrer = colaListos.splice(masPrioritarioColaListos[1], masPrioritarioColaListos[1]+1); // [1] idx
        // colaCorriendo.push(procesoACorrer);
        console.log(`Antes del filtro`);
        console.log({colaListos});
        console.log({masPrioritarioColaListos});

        // Sospecho que esto es lo que no está funcionando... No termino de comprender el por qué, pero parece que no lo está sacando...
        colaListos = colaListos.filter(p => p.id != masPrioritarioColaListos.id);
        
        console.log(`Después del filtro`);
        console.log({colaListos});

        colaCorriendo.push(masPrioritarioColaListos);
        
        // Caso primera vez que ejecuta
        if ((tip > 0) && (colaCorriendo[0].tComputoTotalCpu == 0)) ejecutarTip();
        else pe(); // Vuelvo a entrar para computar uso de Cpu
    }




    // let prioridades = [];

    // if ((colaCorriendo.length > 0) && (procesosMovidos.length > 0)) { // Si no hubo nuevos arribos a la cola de listos, no me interesa cambiar, por lo tanto seguiré de largo. 
    //     //
    //     procesosMovidos.forEach(proceso => prioridades.push(proceso.prioridad));
    //     let masAlta = Math.min.apply(null, prioridades);
        
    //     if (colaCorriendo[0].prioridad > masAlta) { // Si el proceso que está corriendo tiene un valor más alto, es porque tienen prioridad más baja.
    //         procesoACorrer = colaListos.filter(proceso => proceso.prioridad == masAlta);
    //         let idx = colaListos.indexOf(procesoACorrer);
    //         let procesoACorrer = colaListos.splice(idx, idx+1);
        
    //         let procesoCorriendo = colaCorriendo.pop();
    //         procesoCorriendo.fuePausado = true;
        
    //         colaCorriendo.push(procesoACorrer);
    //         colaListos.push(procesoCorriendo);
    //     } else {
    //         ejecutarRafaga();
    //     }
    
    // } else if ((colaCorriendo.length == 0) && (colaListos.length > 0)) {
    //     prioridades = [];
    //     colaListos.forEach(proceso => prioridades.push(proceso.prioridad));
    //     let masAlta = Math.min.apply(null, prioridades);
    //     let procesoACorrer = colaListos.filter(proceso => proceso.prioridad == masAlta); // Busco
    //     let idx = colaListos.indexOf(procesoACorrer);                                    // Obtengo el índice
    //     procesoACorrer = colaListos.splice(idx, idx+1);                                  // Lo popeo de la cola
    //     colaCorriendo.push(procesoACorrer);                                              // Le asigno la cpu
    // }

}               

function rr() {
    // console.log('Dentro de RR');

    if (colaCorriendo.length > 0) {
        if ((colaCorriendo[0].tComputoParcialQuantum == quantum) && (colaCorriendo[0].tComputoParcialQuantum < colaCorriendo[0].tRafagaCpu)) { // Todavía no completó la ráfaga pero se le agotó el quantum
            let procesoADesasignar = colaCorriendo.pop();
            procesoADesasignar.fuePausado = true;
            colaListos.push(procesoADesasignar);

            // Desasigno proceso en Cpu, pero lo ingreso a cola de listos, todavía le falta terminar su rafaga de Cpu
            let procesoACorrer = colaListos.shift(); // Si no había otros procesos esperando, volverá a entrar a Cpu el mismo proceso que estaba corriendo recién. Será un push cola listos y pop cola listos del mismo elemento
            colaCorriendo.push(procesoACorrer);
        }
        else if ((colaCorriendo[0].tComputoParcialQuantum == quantum) && (colaCorriendo[0].tComputoParcialQuantum == colaCorriendo[0].tRafagaCpu)) { // Caso completó rafaga dentro del tiempo del quantum
            desasignarCpu();
        } 
    }

    if ((colaCorriendo.length == 0) && (colaListos.length > 0)) {
        let procesoACorrer = colaListos.shift();
        colaCorriendo.push(procesoACorrer);
    }
    //
    // Sino será tiempo de Cpu desperdiciado
}

// Comparamos las duraciones de ráfagas para qudarnos con la más corta y asignar el proceso correspondiente a la cpu
function spn() {
    // console.log('Dentro de SPN');

    if ((colaCorriendo.length > 0) && (colaCorriendo[0].tComputoParcialCpu == tRafagaCpu)) desasignarCpu();

    // Para no duplicar código no encadeno los if's  como hacía antes

    if ((colaCorriendo.length == 0) && (colaListos.length > 0)) {
        let duracionRafagas = [];
        colaListos.forEach(p => duracionRafagas.push(p.tRafagaCpu));
        let masCorto = Math.min.apply(null, duracionRafagas);
        let idx = duracionRafagas.indexOf(masCorto);
        let procesoACorrer = colaListos.splice(idx, idx+1);
        colaCorriendo.push(procesoACorrer);
    }
    //
    // Sino será tiempo de Cpu desperdiciado
}

function srt(procesosMovidos) {
    // console.log('Dentro de SRT');

    let duracionRafagas = [];

    if (colaCorriendo.length > 0) {
        if ((colaCorriendo[0].tComputoParcialCpu < tRafagaCpu) && (procesosMovidos.length > 0)) { // Sino hay procesos movidos, y la ráfaga de cpu todavía no se completó, no hago nada, seguiré ejecutando...
            procesosMovidos.forEach(proceso => duracionRafagas.push(proceso.tRafagaCpu));
            let masCorta = Math.min.apply(null, duracionRafagas);
            
            if ((colaCorriendo[0].tRafagaCpu - colaCorriendo[0].tComputoParcialCpu) > masCorta) {
                procesoACorrer = colaListos.filter(proceso => proceso.tRafagaCpu == masCorta);
                let idx = colaListos.indexOf(procesoACorrer);
                let procesoACorrer = colaListos.splice(idx, idx+1);

                let procesoCorriendo = colaCorriendo.pop(); // Desasigno Cpu, pero entra en cola de listos, por lo que volverá a ejectuar luego.
                procesoCorriendo.fuePausado = true;
                colaListos.push(procesoCorriendo);

                colaCorriendo.push(procesoACorrer);
            }
        
        } else if (colaCorriendo[0].tComputoParcialCpu == tRafagaCpu) desasignarCpu();
    }
    //
    if ((colaCorriendo.length == 0) && (colaListos.length > 0)) { // No hay procesos corriendo y hay procesos en cola. Elijo el de duración de ráfga más corta para que continúe.
        duracionRafagas = [];
        colaListos.forEach(proceso => duracionRafagas.push(proceso.tRafagaCpu));
        let masCorta = Math.min.apply(null, duracionRafagas);
        let procesoACorrer = colaListos.filter(proceso => proceso.tRafagaCpu == masCorta);
        let idx = colaListos.indexOf(procesoACorrer);
        procesoACorrer = colaListos.splice(idx, idx+1);
        colaCorriendo.push(procesoACorrer);
    }
}

/* -------------------------------------------------------------------------------------------- */

// Funciones comúnes

// Filtra los procesos nuevos y bloqueados que están listos para ser movidos a la cola de listos,
// si exisiteron procesos listos para mover, se mueven a la cola de listos.
function moverProcesosAColaListos() {
    let nuevosAMover = [];
    let bloqueadosAMover = [];
    let procesosAMover = [];

    // Moviento de procesos nuevos
    if (colaNuevos.length > 0) {
        nuevosAMover = colaNuevos.filter(p => p.tArribo == tiempo);
        colaNuevos = colaNuevos.filter(p => p.tArribo != tiempo);
        if (nuevosAMover.length > 0) {
            colaNuevos.forEach((p) => console.log('colaNuevos P'+p.id));
            nuevosAMover.forEach((p) => console.log('nuevosAMover P'+p.id));
        }
    }

    // Moviento de procesos bloqueados
    if (colaBloqueados.length > 0) {
        bloqueadosAMover = colaBloqueados.filter(proceso => proceso.tComputoParcialES == proceso.tRafagaES);
        colaBloqueados = colaBloqueados.filter(proceso => proceso.tComputoParcialES != proceso.tRafagaES);
        colaBloqueados.forEach((p) => console.log('colaBloqueados P'+p.id));
        if (bloqueadosAMover.length > 0) {
            bloqueadosAMover.forEach((p) => {
                p.tComputoTotalES += p.tComputoParcialES;
                p.tComputoParcialES = 0;   
                console.log('bloqueadosAMover P'+p.id);
            });
        }
    }

    // Concatenación de ambos resultados
    if ((nuevosAMover.length > 0) || (bloqueadosAMover.length > 0)) {
        procesosAMover = procesosAMover.concat(nuevosAMover, bloqueadosAMover);
        if (procesosAMover.length > 0) procesosAMover.forEach((p) => console.log('Moviendo procesos a cola de listos P'+p.id));
        colaListos = colaListos.concat(procesosAMover);
    }

    return [procesosAMover];
}

/* -------------------------------------------------------------------------------------------- */

function ejecutarPlanificacion(tipoPlanificacion, procesosMovidos) {
    // Si tiene que ejecutar tip por más de una und, ejecuto y retorno sin seguir hacia las planificaciones
    if ((colaCorriendo.length > 0) && (colaCorriendo[0].tComputoTip < tip)) {
        ejecutarTip();
        return
    }
    
    switch (tipoPlanificacion) {
        case 1: //FCFS (First Come First Served)
            fcfs();
            break;
        case 2: //Prioridad Externa   
            pe();                
            break;
        case 3: //Round-Robin
            rr();
            break;
        case 4: //SPN (Shortest Process Next)
            spn();
            break;
        case 5: //SRTN (Shortest Remaining Time Next)
            srt(procesosMovidos);
            break;
    }
}

/* -------------------------------------------------------------------------------------------- */

function getMayorPrioridad() {
    let prioridades = colaListos.map(p => p.prioridad);
    let prioritario = colaListos.find(p => p.prioridad == Math.min.apply(null, prioridades));
    // console.log({prioridades, prioritario}); // Obtiene correctamente el proceso más prioritario


    // // creates a new exception type:
    // function FatalError(){ Error.apply(this, arguments); this.name = "FatalError"; }
    // FatalError.prototype = Object.create(Error.prototype);

    // // and then, use this to trigger the error:
    // throw new FatalError("Something went badly wrong!");

    return prioritario;
}

/* -------------------------------------------------------------------------------------------- */

function ejecutarRafaga() {
    console.log('Usando CPU... P'+colaCorriendo[0].id);
    colaCorriendo[0].tComputoParcialCpu += 1;
    tUsoCpu += 1;
}

/* -------------------------------------------------------------------------------------------- */

function ejecutarTip() {
    // console.log("Entré al if");
    colaCorriendo[0].tComputoTip += 1;
    tUsoSo += 1;
    console.log('TIP aplicando a P'+colaCorriendo[0].id);
    
    if (colaCorriendo[0].tComputoTip == tip) console.log('TIP En el próximo turno comenzará a hacer uso de CPU P'+colaCorriendo[0].id);
}

function ejecutarTcp() {
    if ((colaCorriendo[0].tComputoTcp < tcp) && (tcp > 0)) {
        console.log('Ejecutando TCP... P'+colaCorriendo[0].id);
        colaCorriendo[0].tComputoTcp += 1;
        tUsoSo += 1;
        console.log('TCP aplicando a P'+colaCorriendo[0].id);
    
    } else {
        let procesoDesasignado = desasignarCpu();
        procesoDesasignado.tComputoTcp = 0;
        
        if (!procesoDesasignado.fuePausado) {
            procesoDesasignado.tComputoTotalCpu += procesoDesasignado.tComputoParcialCpu;
            procesoDesasignado.tComputoParcialCpu = 0;
            colaBloqueados.push(procesoDesasignado);
            console.log('Finalizó el TCP, ingresó a cola de Bloqueados: P'+procesoDesasignado.id);
        } else {
            colaListos.push(procesoDesasignado);
            console.log('Finalizó el TCP, ingresó a cola de Listos porque fue Pausado, no se resetean los computos: P'+procesoDesasignado.id);
        }
        
    }
}

function ejecutarTfp() {
    // Sumo cómputo de TFP hasta que sea = a TFP (total), luego entra a cola de terminados 
    if ((colaCorriendo[0].tComputoTfp < tfp) && (tfp > 0)) {
        console.log('Ejecutando TFP... P'+colaCorriendo[0].id);
        colaCorriendo[0].tComputoTfp += 1;
        tUsoSo += 1; 

    } else {
        let procesoDesasignado = desasignarCpu();
        procesoDesasignado.tComputoTotalCpu += procesoDesasignado.tComputoParcialCpu;
        procesoDesasignado.tComputoParcialCpu = 0;
        procesoDesasignado.tRetorno = tiempo;

        colaTerminados.push(procesoDesasignado);
        console.log('Finalizó el TFP, ingresó a la cola de TERMINADOS P'+procesoDesasignado.id);
    }  
}

/* -------------------------------------------------------------------------------------------- */

// asignarCpu() se asigna Cpu dentro de cada planificación, porque depende de condiciones variables

function desasignarCpu() {
    let procesoADesasignar = colaCorriendo.pop();
    // colaBloqueados.push(procesoADesasignar);
    console.log('Abandonando CPU... P'+procesoADesasignar.id);    
    return procesoADesasignar;
}

/* -------------------------------------------------------------------------------------------- */

// Computo de tiempos en terminarCiclo() a no ser que sea imprescindible hacerlo que otro lugar...
function terminarCiclo() {
    
    if (colaCorriendo.length == 0) tCpuDesocupada += 1;
    //
    if (colaBloqueados.length > 0) colaBloqueados.forEach(p => p.tComputoParcialES += 1);
    //
    if (colaListos.length > 0) colaListos.forEach(p => p.tEspera += 1);
    //
    if (colaTerminados.length < cantProcesos) tiempo += 1;
}

/* -------------------------------------------------------------------------------------------- */

function imprimirResultados() {
    // Luego pasar todo a html con varios a idElemento.innerHTML += ...
    
    console.log({
        msg1: `Tiempo de finalización ${tiempo}`,
        msg2: `Tiempo de CPU ${tUsoCpu}`,
        msg3: `Tiempo de SO ${tUsoSo}`,
        msg4: `Tiempo de CPU desocupada ${tCpuDesocupada}`
    });

    colaTerminados.forEach(p => {
        console.log({
            msg1: `Para ${p.id}:`,
            msg2: `Tiempo de Retorno ${p.tRetorno}`,
            msg3: `Tiempo de Retorno Normalizado ${p.tRetorno - p.tEspera}`,
            msg4: `Tiempo en Estado de Listo ${p.tEspera}`
        });
    });
    
    let total = 0;
    for(let i = 0; i < colaTerminados.length; i++) total += colaTerminados[i].tRetorno;
    let avg = total / colaTerminados.length;
    console.log({
        msg1: `Para la tanda de procesos:`,
        msg2: `Tiempo de Retorno ${tiempo}`,
        msg3: `Tiempo Medio de Retorno ${avg}`
    });

    console.log({
        msg1: `Tiempos de CPU desocupada ${tCpuDesocupada}`,
        msg2: `Tiempo de CPU utilizada por el SO ${tUsoSo}`,
        msg3: `Tiempo de CPU utlizada por los procesos:`,
        // msg: `- Absoluto = ${tUsoCpu}`,
        // msg: `- Porcentual = ${tUsoCpu}`
    });
    
    colaTerminados.forEach(p => {
        console.log({
            msg1: `Absolutos:`,
            msg2: `Para ${p.id}: ${p.tComputoTotalCpu}`,
        });
    });
    colaTerminados.forEach(p => {
        console.log({
            msg1: `Porcentuales:`,
            msg2: `Para ${p.id}: ${Math.round((p.tComputoTotalCpu * 100)/tUsoCpu)}`,
        });
    });
        
}

/* -------------------------------------------------------------------------------------------- */

function main() {
    const tipoPlanificacion = 2; // Hardcodeado
    while (colaTerminados.length < cantProcesos) {
    // while (tiempo < 32) {
        console.log({tiempo});
        let movidos = moverProcesosAColaListos();
        ejecutarPlanificacion(tipoPlanificacion, movidos);
        terminarCiclo();
        console.log('-----------------------');
    }
    

    // Finalizando imprimo
    console.log({
        colaNuevos, 
        colaListos, 

        colaCorriendo, 
        colaBloqueados,
        colaTerminados
    });
    imprimirResultados();    

    // Generación de archivo
    const resultado = {
        colaNuevos,
        colaListos,
        colaCorriendo,
        colaBloqueados,
        colaTerminados
    };
    const resultadoStr = JSON.stringify(resultado);
    fs.writeFileSync("../Tandas-procesos/resultado.txt", resultadoStr);
    console.log(resultadoStr);
}

/* -------------------------------------------------------------------------------------------- */

// Desencadenador

function tratarArchivo(archivo) {
	// NO BORRAR
    // const guardadoEn = archivo.filepath;
	// const contenidoDelArchivo = fs.readFileSync(guardadoEn);
    // const contenidoDelArchivoString = contenidoDelArchivo.toString()
    // var listaProcesos = eval('(' + contenidoDelArchivoString + ')'); 
    // Data del archivo hardcodeado, descomentar lo de arriba
    
    var listaProcesos = [ // Considero 
        {
            id: 1,
            tArribo: 0,
            cantRafagas: 2,
            tRafagaCpu: 10,
            tRafagaES: 25,
            prioridad: 2
        },
        {
            id: 2,
            tArribo: 4,
            cantRafagas: 2,
            tRafagaCpu: 20,
            tRafagaES: 25,
            prioridad: 1
        },
        {
            id: 3,
            tArribo: 8,
            cantRafagas: 3,
            tRafagaCpu: 5,
            tRafagaES: 25,
            prioridad: 45
        },
        {
            id: 4,
            tArribo: 10,
            cantRafagas: 2,
            tRafagaCpu: 15,
            tRafagaES: 25,
            prioridad: 100
        },
    ];
    // console.log(listaDeProcesos);
    listaProcesos.forEach(p => {
        const objAux = new Proceso(
            p.id, 
            p.tArribo, 
            p.cantRafagas, 
            p.tRafagaCpu, 
            p.tRafagaES,
            p.prioridad
        );
        colaNuevos.push(objAux);
        cantProcesos += 1;
    });

    planificaciones.func1('Hola');
    planificaciones.func2(colaNuevos);
    console.log(colaNuevos); // No lo modifica... es pasado por valor, no por referencia al objeto

    main();
    colaNuevos = [];
    cantProcesos = 0;
}

module.exports = tratarArchivo;
