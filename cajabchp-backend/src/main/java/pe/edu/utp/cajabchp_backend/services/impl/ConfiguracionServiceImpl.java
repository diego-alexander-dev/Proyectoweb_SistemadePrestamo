package pe.edu.utp.cajabchp_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.cajabchp_backend.dtos.ConfiguracionDTO;
import pe.edu.utp.cajabchp_backend.dtos.ConfiguracionUpdateDTO;
import pe.edu.utp.cajabchp_backend.exception.BusinessRuleException;
import pe.edu.utp.cajabchp_backend.models.Configuracion;
import pe.edu.utp.cajabchp_backend.repositories.ConfiguracionRepository;
import pe.edu.utp.cajabchp_backend.services.ConfiguracionService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ConfiguracionServiceImpl implements ConfiguracionService {

    private final ConfiguracionRepository configuracionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ConfiguracionDTO> listarTodas() {
        return configuracionRepository.findAll().stream()
            .map(c -> ConfiguracionDTO.builder()
                .idConfiguracion(c.getIdConfiguracion())
                .parametro(c.getParametro())
                .valor(c.getValor())
                .fechaModificacion(c.getFechaModificacion())
                .build())
            .toList();
    }

    @Override
    @Transactional
    public ConfiguracionDTO actualizar(ConfiguracionUpdateDTO dto) {
        Objects.requireNonNull(dto, "Los datos de configuración no pueden ser nulos");
        String parametro = dto.getParametro().trim();
        String valorStr = dto.getValor().trim();

        validarParametroYValor(parametro, valorStr);

        Configuracion config = configuracionRepository.findByParametro(parametro)
            .orElseGet(() -> Configuracion.builder()
                .parametro(parametro)
                .build());

        config.setValor(valorStr);
        config.setFechaModificacion(LocalDate.now());

        Configuracion guardada = configuracionRepository.save(config);

        return ConfiguracionDTO.builder()
            .idConfiguracion(guardada.getIdConfiguracion())
            .parametro(guardada.getParametro())
            .valor(guardada.getValor())
            .fechaModificacion(guardada.getFechaModificacion())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getValorBigDecimal(String parametro, BigDecimal defaultVal) {
        return configuracionRepository.findByParametro(parametro)
            .map(c -> {
                try {
                    return new BigDecimal(c.getValor());
                } catch (Exception e) {
                    return defaultVal;
                }
            })
            .orElse(defaultVal);
    }

    @Override
    @Transactional(readOnly = true)
    public int getValorInt(String parametro, int defaultVal) {
        return configuracionRepository.findByParametro(parametro)
            .map(c -> {
                try {
                    return Integer.parseInt(c.getValor());
                } catch (Exception e) {
                    return defaultVal;
                }
            })
            .orElse(defaultVal);
    }

    private void validarParametroYValor(String parametro, String valorStr) {
        try {
            double val = Double.parseDouble(valorStr);
            if (val < 0) {
                throw new BusinessRuleException("El parámetro " + parametro + " no puede ser negativo");
            }

            switch (parametro) {
                case "tasa_base", "tasa_excelencia", "mora_porcentaje" -> {
                    if (val > 100.0) {
                        throw new BusinessRuleException("El porcentaje " + parametro + " no puede ser mayor al 100%");
                    }
                }
                case "promedio_excelencia", "gracia_promedio_min" -> {
                    if (val > 20.0) {
                        throw new BusinessRuleException("La nota mínima " + parametro + " no puede ser mayor a 20.00");
                    }
                }
                case "gracia_dias" -> {
                    if (val > 365.0) {
                        throw new BusinessRuleException("Los días de gracia no pueden exceder 365 días");
                    }
                }
                default -> {
                    // Parámetro admitido genéricamente
                }
            }
        } catch (NumberFormatException e) {
            throw new BusinessRuleException("El valor para el parámetro " + parametro + " debe ser numérico");
        }
    }
}
