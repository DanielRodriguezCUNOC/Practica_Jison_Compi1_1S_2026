# Practica 2 - Compiladores 1

Aplicacion web para analizar configuraciones de gramatica Wison, validar su semantica y construir  de analizadores LL1 :3.

Este repositorio contiene una interfaz en SvelteKit y un flujo de procesamiento que incluye:

- Analisis de entrada Wison
- Validacion semantica de gramatica
- Calculo de conjuntos PRIMERO/SIGUIENTE
- Construccion de tabla LL1
- Construccion del analizador para cada gramatica objetivo
- Reporte de conflictos LL1
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
- Java
- Node
- JavaScript

## Estructura general

La aplicacion principal se encuentra en:

`practica-jison/`

Directorios relevantes:

- `practica-jison/src/lib/wison/`: logica de gramatica, validacion y LL1
- `practica-jison/src/routes/api/wison/evaluate/`: endpoint de evaluacion
- `practica-jison/src/lib/components/parser/`: paneles de la interfaz
- `practica-jison/src/lib/stores/`: estado global de UI y errores
- `practica-jison/src/lib/services/`: consumo de API desde frontend

## Flujo de evaluacion

Al evaluar una configuracion desde la UI, el flujo principal es:

1. Parseo de la entrada Wison
2. Validacion semantica
3. Calculo de conjuntos PRIMERO/SIGUIENTE
4. Construccion de tabla LL1
5. Persistencia de gramaticas mediante API Java
6. Construccion del analizador en tiempo real al pedirlo a la API
7. Deteccion y formateo de conflictos
8. Respuesta para renderizado en paneles de la interfaz

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

#Nota

Este es un proyecto académico que me permitié conocer de mejor manera como funciona un analizador LL1.
En consecuencia se debia pasar la teoría recibida a una visualización práctica, lo cual representó un gran reto :)
