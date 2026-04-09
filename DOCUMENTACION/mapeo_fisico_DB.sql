CREATE TABLE analizador(
    -> id BIGINT NOT NULL AUTO_INCREMENT,
    -> nombre VARCHAR (120) NOT NULL,
    -> gramatica_wison LONGTEXT NOT NULL,
    -> fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -> PRIMARY KEY (id)
    -> );