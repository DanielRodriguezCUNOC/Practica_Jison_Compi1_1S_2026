package paboomi.api.jison.db;

import java.time.LocalDateTime;

public class AnalizadorResumenEntity {
  private long id;
  private String nombre;
  private LocalDateTime createdAt;

  public AnalizadorResumenEntity() {
  }

  public AnalizadorResumenEntity(long id, String nombre, LocalDateTime createdAt) {
    this.id = id;
    this.nombre = nombre;
    this.createdAt = createdAt;
  }

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
