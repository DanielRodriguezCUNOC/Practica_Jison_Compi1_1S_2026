package paboomi.api.jison.connection;

import java.sql.SQLException;

import java.sql.Connection;

import org.apache.tomcat.jdbc.pool.DataSource;
import org.apache.tomcat.jdbc.pool.PoolProperties;

public class DBConnectionSingleton {
  private static final String IP = "localhost";
  private static final int PUERTO = 3306;
  private static final String SCHEMA = "analizadores";
  private static final String USER_NAME = "user_compi1";
  private static final String PASSWORD = "Compiladores_1";
  private static final String URL = "jdbc:mysql://" + IP + ":" + PUERTO + "/"
      + SCHEMA;
  private static DBConnectionSingleton instance;

  private DataSource datasource;

  private DBConnectionSingleton() {
    try {
      Class.forName("com.mysql.cj.jdbc.Driver");
      PoolProperties p = new PoolProperties();
      p.setUrl(URL);
      p.setDriverClassName("com.mysql.cj.jdbc.Driver");
      p.setUsername(USER_NAME);
      p.setPassword(PASSWORD);
      p.setJmxEnabled(true);
      p.setTestWhileIdle(false);
      p.setTestOnBorrow(true);
      p.setValidationQuery("SELECT 1");
      p.setTestOnReturn(false);
      p.setValidationInterval(30000);
      p.setTimeBetweenEvictionRunsMillis(30000);
      p.setMaxActive(100);
      p.setInitialSize(10);
      p.setMaxWait(10000);
      p.setRemoveAbandonedTimeout(60);
      p.setMinEvictableIdleTimeMillis(30000);
      p.setMinIdle(10);
      p.setLogAbandoned(true);
      p.setRemoveAbandoned(true);
      p.setJdbcInterceptors(
          "org.apache.tomcat.jdbc.pool.interceptor.ConnectionState;"
              + "org.apache.tomcat.jdbc.pool.interceptor.StatementFinalizer");
      datasource = new DataSource(p);
      datasource.setPoolProperties(p);

    } catch (ClassNotFoundException e) {
      System.out.println("Error al cargar el driver de la base de datos");
    }
  }

  public Connection getConnection() {
    try {
      return datasource.getConnection();
    } catch (SQLException e) {
      System.out.println("Error al obtener la conexión");
    }
    return null;
  }

  public static DBConnectionSingleton getInstance() {
    if (instance == null) {
      instance = new DBConnectionSingleton();
    }
    return instance;
  }

  public void increasePoolSize(int size) {
    int currentMax = datasource.getPoolProperties().getMaxActive();
    datasource.getPoolProperties().setMaxActive(currentMax + size);
  }
}
