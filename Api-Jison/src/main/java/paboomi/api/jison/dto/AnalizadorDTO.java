package paboomi.api.jison.dto;

public class AnalizadorDTO {
  private long id;
  private String nombre;
  private String wisonSource;

  public AnalizadorDTO() {
  }

  public AnalizadorDTO(long id, String nombre, String wisonSource) {
    this.id = id;
    this.nombre = nombre;
    this.wisonSource = wisonSource;
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
}
