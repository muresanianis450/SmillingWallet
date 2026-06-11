package backend.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Stores a patient's list of preferred cities as a single comma-joined column.
 * Keeps the schema flat (no join table), matching this codebase's convention of
 * avoiding JPA associations in favour of plain columns.
 */
@Converter
public class CityListConverter implements AttributeConverter<List<String>, String> {

    private static final String DELIM = ",";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) return null;
        return attribute.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(DELIM));
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new ArrayList<>();
        return Arrays.stream(dbData.split(DELIM))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
