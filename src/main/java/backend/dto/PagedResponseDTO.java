package backend.dto;


import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class PagedResponseDTO<T>{
    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean last;

    public PagedResponseDTO(List<T> allItems, int page, int size) {
        if (size <= 0 ) {
            throw new IllegalArgumentException("Size must be greater than 0");
        }
        if (page < 0 ) {
            throw new IllegalArgumentException("Page must be greater than or equal to 0");
        }

        this.page = page;
        this.size = size;
        this.totalElements = allItems.size();
        this.totalPages = (int) Math.ceil((double) allItems.size() / size);
        this.last = (page + 1) >= this.totalPages;

        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, allItems.size());

        // Wrap in a plain ArrayList: a subList/List.of() view serializes as an
        // exotic list type that the Redis default-typing deserializer can't rebuild.
        this.content = (fromIndex >= allItems.size())
                ? new ArrayList<>()
                : new ArrayList<>(allItems.subList(fromIndex, toIndex));
    }

    // Used by Jackson when reading a cached page back from Redis. The primary
    // constructor computes the paging fields, so it can't be used for deserialization.
    @JsonCreator
    public PagedResponseDTO(
            @JsonProperty("content") List<T> content,
            @JsonProperty("page") int page,
            @JsonProperty("size") int size,
            @JsonProperty("totalElements") long totalElements,
            @JsonProperty("totalPages") int totalPages,
            @JsonProperty("last") boolean last) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
    }

}
