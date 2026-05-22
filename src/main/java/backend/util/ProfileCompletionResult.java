package backend.util;

import java.util.List;

public record ProfileCompletionResult(int completionPct, List<String> missingFields) {}
