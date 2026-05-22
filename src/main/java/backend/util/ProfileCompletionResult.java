package backend.util;

import java.util.List;

public record ProfileCompletionResult(int pct, List<String> missingFields) {}
