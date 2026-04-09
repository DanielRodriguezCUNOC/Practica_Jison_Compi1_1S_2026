# Contexto de Implementacion API Jison (Compilacion en Frontend)

## Objetivo general
Construir una API JavaEE enfocada solo en persistencia de analizadores Wison.

El frontend (Svelte) sera responsable de:
1. Evaluar la configuracion Wison.
2. Calcular FIRST/FOLLOW y tabla LL(1).
3. Generar parser descendente recursivo.
4. Inyectar parser en caliente y ejecutar analisis.

La API JavaEE sera responsable de:
1. Guardar Wison en base de datos.
2. Listar analizadores guardados.
3. Obtener analizador por ID.
4. Actualizar y eliminar analizador (opcional pero recomendado).

## Decision arquitectonica oficial
- NO compilar en backend JavaEE.
- NO ejecutar Node desde JavaEE.
- NO endpoint `/{id}/compilado`.
- SI compilar en frontend.

Motivo:
- Proyecto academico, un solo usuario.
- Menos complejidad operativa.
- Evita instalar/configurar Node en el servidor JavaEE.

## Flujo funcional esperado
1. Usuario escribe Wison en frontend.
2. Frontend evalua y genera parser localmente.
3. Frontend envia Wison a API para guardar.
4. Frontend pide analizador por ID para editar/reutilizar.
5. Frontend vuelve a compilar localmente cuando necesita usarlo.

## Estructura actual relevante
- `src/main/java/paboomi/api/jison/resources/endpoints/SvelteResource.java`
- `src/main/java/paboomi/api/jison/service/GuardarWisonService.java`
- `src/main/java/paboomi/api/jison/service/ObtenerAnalizadorService.java`
- `src/main/java/paboomi/api/jison/connection/DBConnectionSingleton.java`
- `src/main/java/paboomi/api/jison/exceptions/AnalizadorNotFoundException.java`

## Contratos API a implementar

### 1) Guardar analizador
Endpoint:
- `POST /analizadores`

Request JSON:
```json
{
  "nombre": "Analizador A",
  "wisonSource": "Wison ? ... ? Wison"
}
```

Response JSON (201):
```json
{
  "ok": true,
  "id": 1,
  "mensaje": "Analizador guardado correctamente"
}
```

### 2) Listar analizadores
Endpoint:
- `GET /analizadores`

Response JSON (200):
```json
{
  "ok": true,
  "items": [
    { "id": 1, "nombre": "Analizador A", "fechaCreacion": "2026-04-08T10:00:00" }
  ]
}
```

### 3) Obtener analizador por ID
Endpoint:
- `GET /analizadores/{id}`

Response JSON (200):
```json
{
  "ok": true,
  "id": 1,
  "nombre": "Analizador A",
  "wisonSource": "Wison ? ... ? Wison"
}
```

Response JSON (404):
```json
{
  "ok": false,
  "errores": [
    { "tipo": "NotFound", "mensaje": "Analizador no encontrado" }
  ]
}
```

### 4) Actualizar analizador (opcional)
Endpoint:
- `PUT /analizadores/{id}`

Request JSON:
```json
{
  "nombre": "Analizador A v2",
  "wisonSource": "Wison ? ... ? Wison"
}
```

### 5) Eliminar analizador (opcional)
Endpoint:
- `DELETE /analizadores/{id}`

## BD ya creada
```sql
CREATE TABLE analizador(
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    gramatica_wison LONGTEXT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

## Tareas ordenadas por archivo

### A) `db/` (nuevo)
Crear una clase DAO, por ejemplo `AnalizadorDAO.java` con metodos:
1. `long insertar(String nombre, String wisonSource)`
2. `AnalizadorEntity obtenerPorId(long id)`
3. `List<AnalizadorResumenEntity> listar()`
4. `boolean actualizar(long id, String nombre, String wisonSource)` (opcional)
5. `boolean eliminar(long id)` (opcional)

Implementar con `DBConnectionSingleton.getInstance().getConnection()` y `PreparedStatement`.

### B) `dto/` (nuevo)
Crear DTOs:
1. `GuardarAnalizadorRequest` -> `nombre`, `wisonSource`
2. `GuardarAnalizadorResponse` -> `ok`, `id`, `mensaje`
3. `ErrorDTO` -> `tipo`, `mensaje`
4. `AnalizadorDTO` -> `id`, `nombre`, `wisonSource`
5. `AnalizadorResumenDTO` -> `id`, `nombre`, `fechaCreacion`
6. `ListarAnalizadoresResponse` -> `ok`, `items`

No crear DTO `CompiladoResponse` porque la compilacion NO va en API.

### C) `service/GuardarWisonService.java`
Implementar logica real:
1. Validar `nombre` y `wisonSource` no vacios.
2. Llamar DAO para insertar.
3. Retornar ID creado.

### D) `service/ObtenerAnalizadorService.java`
Implementar logica real:
1. Buscar por ID (DAO).
2. Si no existe, lanzar `AnalizadorNotFoundException`.
3. Implementar listado (y opcional actualizar/eliminar).

NO agregar metodos de compilacion ni ejecucion de procesos Node.

### E) `resources/endpoints/SvelteResource.java`
Agregar/ajustar endpoints:
1. `POST /analizadores`
2. `GET /analizadores`
3. `GET /analizadores/{id}`
4. `PUT /analizadores/{id}` (opcional)
5. `DELETE /analizadores/{id}` (opcional)

Eliminar o deprecar `GET /analizadores/{id}/compilado`.

## Reglas de implementacion para Copilot
1. Mantener estilo imperativo (Java clasico).
2. Evitar programacion funcional innecesaria.
3. Agregar comentarios cortos en bloques importantes.
4. Validar null/vacios antes de acceder a BD.
5. Cerrar recursos SQL con `try-with-resources`.
6. Responder JSON consistente para exito y error.

## Integracion con frontend (punto clave)
Frontend compila localmente con sus propios modulos:
- evaluador Wison
- calculo FIRST/FOLLOW
- constructor LL(1)
- generador de parser descendente
- inyeccion en caliente

La API solo entrega y persiste `wisonSource`.

## Orden de trabajo sugerido
1. Completar DAO.
2. Completar DTOs.
3. Implementar servicios de guardar/obtener/listar.
4. Ajustar endpoint `SvelteResource` a CRUD simple.
5. Probar con Postman:
   - Guardar -> Listar -> Obtener.

## Criterio de terminado
Se considera terminado cuando:
1. Se puede guardar Wison desde UI hacia API.
2. Se puede listar y recuperar por ID desde API.
3. Frontend compila localmente sin depender de API para compilacion.
4. API no ejecuta Node ni genera parser.
