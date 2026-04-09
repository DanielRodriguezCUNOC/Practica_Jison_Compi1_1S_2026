package paboomi.api.jison.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import paboomi.api.jison.connection.DBConnectionSingleton;

public class AnalizadorDAO {

  public long insertar(String nombre, String wisonSource) throws SQLException {
    String sql = "INSERT INTO analizador (nombre, gramatica_wison) VALUES (?, ?)";

    Connection rawConnection = DBConnectionSingleton.getInstance().getConnection();
    if (rawConnection == null) {
      throw new SQLException("No se pudo abrir conexion a base de datos.");
    }

    try (Connection connection = rawConnection;
        PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

      statement.setString(1, nombre);
      statement.setString(2, wisonSource);
      statement.executeUpdate();

      try (ResultSet generatedKeys = statement.getGeneratedKeys()) {
        if (generatedKeys.next()) {
          return generatedKeys.getLong(1);
        }
      }
    }

    throw new SQLException("No se pudo obtener el ID generado del analizador.");
  }

  public AnalizadorEntity obtenerPorId(long id) throws SQLException {
    String sql = "SELECT id, nombre, gramatica_wison, fecha_creacion FROM analizador WHERE id = ?";

    Connection rawConnection = DBConnectionSingleton.getInstance().getConnection();
    if (rawConnection == null) {
      throw new SQLException("No se pudo abrir conexion a base de datos.");
    }

    try (Connection connection = rawConnection;
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setLong(1, id);

      try (ResultSet result = statement.executeQuery()) {
        if (!result.next()) {
          return null;
        }

        Timestamp timestamp = result.getTimestamp("fecha_creacion");
        return new AnalizadorEntity(
            result.getLong("id"),
            result.getString("nombre"),
            result.getString("gramatica_wison"),
            timestamp != null ? timestamp.toLocalDateTime() : null);
      }
    }
  }

  public List<AnalizadorResumenEntity> listar() throws SQLException {
    String sql = "SELECT id, nombre, fecha_creacion FROM analizador ORDER BY id DESC";
    List<AnalizadorResumenEntity> items = new ArrayList<>();

    Connection rawConnection = DBConnectionSingleton.getInstance().getConnection();
    if (rawConnection == null) {
      throw new SQLException("No se pudo abrir conexion a base de datos.");
    }

    try (Connection connection = rawConnection;
        PreparedStatement statement = connection.prepareStatement(sql);
        ResultSet result = statement.executeQuery()) {

      while (result.next()) {
        Timestamp timestamp = result.getTimestamp("fecha_creacion");
        items.add(new AnalizadorResumenEntity(
            result.getLong("id"),
            result.getString("nombre"),
            timestamp != null ? timestamp.toLocalDateTime() : null));
      }
    }

    return items;
  }

  public boolean actualizar(long id, String nombre, String wisonSource) throws SQLException {
    String sql = "UPDATE analizador SET nombre = ?, gramatica_wison = ? WHERE id = ?";

    Connection rawConnection = DBConnectionSingleton.getInstance().getConnection();
    if (rawConnection == null) {
      throw new SQLException("No se pudo abrir conexion a base de datos.");
    }

    try (Connection connection = rawConnection;
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, nombre);
      statement.setString(2, wisonSource);
      statement.setLong(3, id);
      return statement.executeUpdate() > 0;
    }
  }

  public boolean eliminar(long id) throws SQLException {
    String sql = "DELETE FROM analizador WHERE id = ?";

    Connection rawConnection = DBConnectionSingleton.getInstance().getConnection();
    if (rawConnection == null) {
      throw new SQLException("No se pudo abrir conexion a base de datos.");
    }

    try (Connection connection = rawConnection;
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setLong(1, id);
      return statement.executeUpdate() > 0;
    }
  }
}
