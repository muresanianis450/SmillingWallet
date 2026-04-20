package backend.dto;


import lombok.Getter;

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

        this.content = (fromIndex >= allItems.size())
                ? List.of()
                : allItems.subList(fromIndex,toIndex);
    }

}
