#!/bin/bash

# Ruta al directorio del proyecto
PROJECT_DIR="/home/luluwalilith/Documentos/1S 2026 CUNOC/COMPI 1/PRACTICA 2/Practica_Jison_Compi1_1S_2026/Api-Jison/"

# Ruta al archivo pom.xml
POM_FILE="$PROJECT_DIR/pom.xml"

# Función para limpiar el proyecto
clean_project() {
  echo "Eliminando directorio target/..."
  rm -rf "$PROJECT_DIR/target/"
  echo "Ejecutando mvn clean..."
  mvn clean -f "$POM_FILE"
}

# Función para construir el proyecto
build_project() {
  echo "Ejecutando mvn clean package…"   # usamos package
  mvn clean package -f "$POM_FILE"
  
  # — Si lo prefieres usar install, descomenta la siguiente línea y comenta la anterior:
  # echo "Ejecutando mvn clean install…"
  # mvn clean install -f "$POM_FILE"

  echo "Build completado exitosamente."
}

# Verificar argumento
case "$1" in
  clean)
    clean_project
    ;;
  build)
    build_project
    ;;
  clean-build | rebuild)
    clean_project
    build_project
    ;;
  *)
    echo "Uso: $0 {clean|build|clean-build}"
    exit 1
    ;;
esac