package paboomi.api.jison.dto;

public class GuardarAnalizadorRequest {
  private String nombre;
  private String wisonSource;

  public GuardarAnalizadorRequest() {
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
