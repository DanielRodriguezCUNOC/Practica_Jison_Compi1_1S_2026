package paboomi.api.jison.db;

import java.time.LocalDateTime;

public class AnalizadorEntity {
  private long id;
  private String nombre;
  private String wisonSource;
  private LocalDateTime createdAt;

  public AnalizadorEntity() {
  }

  public AnalizadorEntity(long id, String nombre, String wisonSource, LocalDateTime createdAt) {
    this.id = id;
    this.nombre = nombre;
    this.wisonSource = wisonSource;
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

  public String getWisonSource() {
    return wisonSource;
  }

  public void setWisonSource(String wisonSource) {
    this.wisonSource = wisonSource;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
