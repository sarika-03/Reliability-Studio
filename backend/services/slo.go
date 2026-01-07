package services

func CalculateSLO(errorRate float64) string {
	if errorRate > 1 {
		return "degraded"
	}
	return "healthy"
}
