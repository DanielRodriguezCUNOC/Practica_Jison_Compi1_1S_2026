package paboomi.api.jison.resources.endpoints;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import paboomi.api.jison.dto.AccionResponse;
import paboomi.api.jison.dto.AnalizadorDTO;
import paboomi.api.jison.dto.AnalizadorResumenDTO;
import paboomi.api.jison.dto.ErrorResponse;
import paboomi.api.jison.dto.GuardarAnalizadorRequest;
import paboomi.api.jison.dto.GuardarAnalizadorResponse;
import paboomi.api.jison.dto.ListarAnalizadoresResponse;
import paboomi.api.jison.dto.ObtenerAnalizadorResponse;
import paboomi.api.jison.exceptions.AnalizadorNotFoundException;
import paboomi.api.jison.service.GuardarWisonService;
import paboomi.api.jison.service.ObtenerAnalizadorService;
import java.util.List;

@Path("/analizadores")
@Produces(MediaType.APPLICATION_JSON)
public class SvelteResource {
  private final GuardarWisonService guardarWisonService;
  private final ObtenerAnalizadorService obtenerAnalizadorService;

  public SvelteResource() {
    this.guardarWisonService = new GuardarWisonService();
    this.obtenerAnalizadorService = new ObtenerAnalizadorService();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  public Response crearAnalizador(GuardarAnalizadorRequest request) {
    if (request == null) {
      return buildError(Response.Status.BAD_REQUEST, "Validacion", "El cuerpo JSON es obligatorio.");
    }

    try {
      long id = guardarWisonService.guardar(request.getNombre(), request.getWisonSource());
      GuardarAnalizadorResponse response = new GuardarAnalizadorResponse(true, id,
          "Analizador guardado correctamente");
      return Response.status(Response.Status.CREATED).entity(response).build();

    } catch (IllegalArgumentException e) {
      return buildError(Response.Status.BAD_REQUEST, "Validacion", e.getMessage());
    } catch (RuntimeException e) {
      return buildError(Response.Status.INTERNAL_SERVER_ERROR, "DB", e.getMessage());
    }
  }

  @GET
  public Response listarAnalizadores() {
    try {
      List<AnalizadorResumenDTO> items = obtenerAnalizadorService.listar();
      return Response.ok(new ListarAnalizadoresResponse(items)).build();
    } catch (RuntimeException e) {
      return buildError(Response.Status.INTERNAL_SERVER_ERROR, "DB", e.getMessage());
    }
  }

  @GET
  @Path("/{id}")
  public Response obtenerAnalizador(@PathParam("id") long id) {
    try {
      AnalizadorDTO analizador = obtenerAnalizadorService.obtenerPorId(id);
      return Response.ok(new ObtenerAnalizadorResponse(true, analizador)).build();
    } catch (AnalizadorNotFoundException e) {
      return buildError(Response.Status.NOT_FOUND, "NotFound", e.getMessage());
    } catch (RuntimeException e) {
      return buildError(Response.Status.INTERNAL_SERVER_ERROR, "DB", e.getMessage());
    }
  }

  @PUT
  @Path("/{id}")
  @Consumes(MediaType.APPLICATION_JSON)
  public Response actualizarAnalizador(@PathParam("id") long id, GuardarAnalizadorRequest request) {
    if (request == null) {
      return buildError(Response.Status.BAD_REQUEST, "Validacion", "El cuerpo JSON es obligatorio.");
    }

    try {
      obtenerAnalizadorService.actualizar(id, request.getNombre(), request.getWisonSource());
      return Response.ok(new AccionResponse(true, id, "Analizador actualizado correctamente")).build();

    } catch (IllegalArgumentException e) {
      return buildError(Response.Status.BAD_REQUEST, "Validacion", e.getMessage());
    } catch (AnalizadorNotFoundException e) {
      return buildError(Response.Status.NOT_FOUND, "NotFound", e.getMessage());
    } catch (RuntimeException e) {
      return buildError(Response.Status.INTERNAL_SERVER_ERROR, "DB", e.getMessage());
    }
  }

  @DELETE
  @Path("/{id}")
  public Response eliminarAnalizador(@PathParam("id") long id) {
    try {
      obtenerAnalizadorService.eliminar(id);
      return Response.ok(new AccionResponse(true, id, "Analizador eliminado correctamente")).build();

    } catch (AnalizadorNotFoundException e) {
      return buildError(Response.Status.NOT_FOUND, "NotFound", e.getMessage());
    } catch (RuntimeException e) {
      return buildError(Response.Status.INTERNAL_SERVER_ERROR, "DB", e.getMessage());
    }
  }

  private Response buildError(Response.Status status, String tipo, String mensaje) {
    return Response.status(status).entity(new ErrorResponse(tipo, mensaje)).build();
  }
}
