package paboomi.api.jison.service;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.lang3.StringUtils;
import paboomi.api.jison.db.AnalizadorDAO;
import paboomi.api.jison.db.AnalizadorEntity;
import paboomi.api.jison.db.AnalizadorResumenEntity;
import paboomi.api.jison.dto.AnalizadorDTO;
import paboomi.api.jison.dto.AnalizadorResumenDTO;
import paboomi.api.jison.exceptions.AnalizadorNotFoundException;

public class ObtenerAnalizadorService {
  private final AnalizadorDAO analizadorDAO;

  public ObtenerAnalizadorService() {
    this.analizadorDAO = new AnalizadorDAO();
  }

  public ObtenerAnalizadorService(AnalizadorDAO analizadorDAO) {
    this.analizadorDAO = analizadorDAO;
  }

  public AnalizadorDTO obtenerPorId(long id) throws AnalizadorNotFoundException {
    try {
      AnalizadorEntity entity = analizadorDAO.obtenerPorId(id);
      if (entity == null) {
        throw new AnalizadorNotFoundException("Analizador no encontrado");
      }

      return new AnalizadorDTO(entity.getId(), entity.getNombre(), entity.getWisonSource());
    } catch (SQLException e) {
      throw new RuntimeException("No se pudo consultar el analizador por ID.", e);
    }
  }

  public List<AnalizadorResumenDTO> listar() {
    try {
      List<AnalizadorResumenEntity> entities = analizadorDAO.listar();
      List<AnalizadorResumenDTO> dtos = new ArrayList<>();

      for (AnalizadorResumenEntity entity : entities) {
        String fechaCreacion = entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null;
        dtos.add(new AnalizadorResumenDTO(entity.getId(), entity.getNombre(), fechaCreacion));
      }

      return dtos;
    } catch (SQLException e) {
      throw new RuntimeException("No se pudo listar los analizadores.", e);
    }
  }

  public void actualizar(long id, String nombre, String wisonSource) throws AnalizadorNotFoundException {
    if (StringUtils.isBlank(nombre)) {
      throw new IllegalArgumentException("El campo 'nombre' es obligatorio.");
    }

    if (StringUtils.isBlank(wisonSource)) {
      throw new IllegalArgumentException("El campo 'wisonSource' es obligatorio.");
    }

    try {
      boolean actualizado = analizadorDAO.actualizar(id, nombre.trim(), wisonSource.trim());
      if (!actualizado) {
        throw new AnalizadorNotFoundException("Analizador no encontrado");
      }
    } catch (SQLException e) {
      throw new RuntimeException("No se pudo actualizar el analizador.", e);
    }
  }

  public void eliminar(long id) throws AnalizadorNotFoundException {
    try {
      boolean eliminado = analizadorDAO.eliminar(id);
      if (!eliminado) {
        throw new AnalizadorNotFoundException("Analizador no encontrado");
      }
    } catch (SQLException e) {
      throw new RuntimeException("No se pudo eliminar el analizador.", e);
    }
  }

}
