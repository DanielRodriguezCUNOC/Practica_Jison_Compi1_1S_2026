package paboomi.api.jison.dto;

public class ErrorDTO {
  private String tipo;
  private String mensaje;

  public ErrorDTO() {
  }

  public ErrorDTO(String tipo, String mensaje) {
    this.tipo = tipo;
    this.mensaje = mensaje;
  }

  public String getTipo() {
    return tipo;
  }

  public void setTipo(String tipo) {
    this.tipo = tipo;
  }

  public String getMensaje() {
    return mensaje;
  }

  public void setMensaje(String mensaje) {
    this.mensaje = mensaje;
  }
}
