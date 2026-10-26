package pe.edu.utp.cajabchp_backend.services;

import pe.edu.utp.cajabchp_backend.dtos.ConfiguracionDTO;
import pe.edu.utp.cajabchp_backend.dtos.ConfiguracionUpdateDTO;

import java.math.BigDecimal;
import java.util.List;

public interface ConfiguracionService {

    List<ConfiguracionDTO> listarTodas();

    ConfiguracionDTO actualizar(ConfiguracionUpdateDTO dto);

    BigDecimal getValorBigDecimal(String parametro, BigDecimal defaultVal);

    int getValorInt(String parametro, int defaultVal);
}
