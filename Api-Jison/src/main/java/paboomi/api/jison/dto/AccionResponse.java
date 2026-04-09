package paboomi.api.jison.dto;

public class AccionResponse {
  private boolean ok;
  private long id;
  private String mensaje;

  public AccionResponse() {
  }

  public AccionResponse(boolean ok, long id, String mensaje) {
    this.ok = ok;
    this.id = id;
    this.mensaje = mensaje;
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

  public String getMensaje() {
    return mensaje;
  }

  public void setMensaje(String mensaje) {
    this.mensaje = mensaje;
  }
}
