# Practica 2 - Compiladores 1 (Wison + LL(1))

Aplicacion web para analizar configuraciones de gramatica Wison, validar su semantica y construir artefactos de analisis LL(1).

Este repositorio contiene una interfaz en SvelteKit y un flujo de procesamiento que incluye:

- Analisis de entrada Wison
- Validacion semantica de gramatica
- Calculo de conjuntos FIRST/FOLLOW
- Construccion de tabla LL(1)
- Reporte de conflictos LL(1)
- Visualizacion de errores y AST en la UI

## Objetivo del proyecto

Implementar una herramienta academica para la practica de Compiladores 1 que permita:

- Cargar y editar una configuracion Wison
- Evaluar la definicion desde la interfaz
- Mostrar errores lexicos, sintacticos y semanticos
- Exponer resultados de analisis para pruebas y depuracion

## Tecnologias

- SvelteKit
- Vite
- Svelte 5
- Sass
- Jison

## Estructura general

La aplicacion principal se encuentra en:

`practica-jison/`

Directorios relevantes:

- `practica-jison/src/lib/wison/`: logica de gramatica, validacion y LL(1)
- `practica-jison/src/routes/api/wison/evaluate/`: endpoint de evaluacion
- `practica-jison/src/lib/components/parser/`: paneles de la interfaz
- `practica-jison/src/lib/stores/`: estado global de UI y errores
- `practica-jison/src/lib/services/`: consumo de API desde frontend

## Flujo de evaluacion

Al evaluar una configuracion desde la UI, el flujo principal es:

1. Parseo de la entrada Wison
2. Validacion semantica
3. Calculo de conjuntos FIRST/FOLLOW
4. Construccion de tabla LL(1)
5. Deteccion y formateo de conflictos
6. Respuesta para renderizado en paneles de la interfaz

## Requisitos

- Node.js 18 o superior
- npm

## Ejecucion local

Desde la raiz de este repositorio:

```bash
cd practica-jison
npm install
npm run dev
```

La aplicacion iniciara en modo desarrollo con Vite.

## Scripts disponibles

Dentro de `practica-jison/`:

```bash
npm run dev      # entorno de desarrollo
npm run build    # compilacion de produccion
npm run preview  # vista previa de build
```

## Estado actual

- Pipeline de evaluacion funcional
- Interfaz con editores ampliados y numeracion de lineas
- Paneles de errores y arbol de derivacion integrados

## Notas

- El archivo de gramatica base del parser se mantiene como `wison-grammar.jison`.
- El proyecto esta orientado a practica academica y experimentacion de analisis sintactico.
