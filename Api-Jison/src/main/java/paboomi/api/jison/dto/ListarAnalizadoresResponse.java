package paboomi.api.jison.dto;

import java.util.ArrayList;
import java.util.List;

public class ListarAnalizadoresResponse {
  private boolean ok;
  private List<AnalizadorResumenDTO> items;

  public ListarAnalizadoresResponse() {
    this.ok = true;
    this.items = new ArrayList<>();
  }

  public ListarAnalizadoresResponse(List<AnalizadorResumenDTO> items) {
    this.ok = true;
    this.items = items;
  }

  public boolean isOk() {
    return ok;
  }

  public void setOk(boolean ok) {
    this.ok = ok;
  }

  public List<AnalizadorResumenDTO> getItems() {
    return items;
  }

  public void setItems(List<AnalizadorResumenDTO> items) {
    this.items = items;
  }
}
