package paboomi.api.jison.service;

import java.sql.SQLException;
import org.apache.commons.lang3.StringUtils;
import paboomi.api.jison.db.AnalizadorDAO;

public class GuardarWisonService {
  private final AnalizadorDAO analizadorDAO;

  public GuardarWisonService() {
    this.analizadorDAO = new AnalizadorDAO();
  }

  public GuardarWisonService(AnalizadorDAO analizadorDAO) {
    this.analizadorDAO = analizadorDAO;
  }

  public long guardar(String nombre, String wisonSource) {
    if (StringUtils.isBlank(nombre)) {
      throw new IllegalArgumentException("El campo 'nombre' es obligatorio.");
    }

    if (StringUtils.isBlank(wisonSource)) {
      throw new IllegalArgumentException("El campo 'wisonSource' es obligatorio.");
    }

    try {
      return analizadorDAO.insertar(nombre.trim(), wisonSource.trim());
    } catch (SQLException e) {
      throw new RuntimeException("No se pudo guardar el analizador en la base de datos.", e);
    }
  }

  public void guardarWison(String wison) {
    guardar("Sin nombre", wison);
  }
}
