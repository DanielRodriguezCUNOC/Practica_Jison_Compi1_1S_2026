package paboomi.api.jison.dto;

public class ObtenerAnalizadorResponse {
  private boolean ok;
  private long id;
  private String nombre;
  private String wisonSource;

  public ObtenerAnalizadorResponse() {
  }

  public ObtenerAnalizadorResponse(boolean ok, AnalizadorDTO dto) {
    this.ok = ok;
    this.id = dto.getId();
    this.nombre = dto.getNombre();
    this.wisonSource = dto.getWisonSource();
  }

  public boolean isOk() {
    return ok;
  }

  public void setOk(boolean ok) {
    this.ok = ok;
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
