package paboomi.api.jison.dto;

public class AnalizadorResumenDTO {
  private long id;
  private String nombre;
  private String fechaCreacion;

  public AnalizadorResumenDTO() {
  }

  public AnalizadorResumenDTO(long id, String nombre, String fechaCreacion) {
    this.id = id;
    this.nombre = nombre;
    this.fechaCreacion = fechaCreacion;
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

  public String getFechaCreacion() {
    return fechaCreacion;
  }

  public void setFechaCreacion(String fechaCreacion) {
    this.fechaCreacion = fechaCreacion;
  }
}
