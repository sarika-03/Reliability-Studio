package config

type Config struct {
	PrometheusURL string
	LokiURL       string
	TempoURL      string
	KubeConfig    string
}

func Load() Config {
	return Config{
		PrometheusURL: "http://localhost:9090",
		LokiURL:       "http://localhost:3100",
		TempoURL:      "http://localhost:3200",
	}

}
