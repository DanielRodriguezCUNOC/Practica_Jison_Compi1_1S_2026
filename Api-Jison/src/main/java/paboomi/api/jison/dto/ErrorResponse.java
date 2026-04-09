package paboomi.api.jison.dto;

import java.util.ArrayList;
import java.util.List;

public class ErrorResponse {
  private boolean ok;
  private List<ErrorDTO> errores;

  public ErrorResponse() {
    this.ok = false;
    this.errores = new ArrayList<>();
  }

  public ErrorResponse(String tipo, String mensaje) {
    this();
    this.errores.add(new ErrorDTO(tipo, mensaje));
  }

  public boolean isOk() {
    return ok;
  }

  public void setOk(boolean ok) {
    this.ok = ok;
  }

  public List<ErrorDTO> getErrores() {
    return errores;
  }

  public void setErrores(List<ErrorDTO> errores) {
    this.errores = errores;
  }
}
