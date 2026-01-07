package handlers

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/sarikasharma2428-web/reliability-studio/models"
	"github.com/sarikasharma2428-web/reliability-studio/services"
	"go.uber.org/zap"
	"net/http"
)

var (
	incidentService *services.IncidentService
	serviceService  *services.ServiceService
	sloService      *services.SLOService
	taskService     *services.TaskService
	logger          *zap.Logger
)

func InitHandlers(is *services.IncidentService, ss *services.ServiceService, slos *services.SLOService, ts *services.TaskService, log *zap.Logger) {
	incidentService = is
	serviceService = ss
	sloService = slos
	taskService = ts
	logger = log
}

// Health check endpoint
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "github.com/sarikasharma2428-web/reliability-studio",
	})
}

// --- Incident Handlers ---

func ListIncidents(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	severity := r.URL.Query().Get("severity")

	incidents, err := incidentService.GetIncidents(r.Context(), status, severity)
	if err != nil {
		logger.Error("Failed to list incidents", zap.Error(err))
		http.Error(w, "Failed to retrieve incidents", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incidents)
}

func CreateIncident(w http.ResponseWriter, r *http.Request) {
	var req models.CreateIncidentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	incident, err := incidentService.Create(r.Context(), req)
	if err != nil {
		logger.Error("Failed to create incident", zap.Error(err))
		http.Error(w, "Failed to create incident", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(incident)
}

func GetIncident(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	incident, err := incidentService.GetByID(r.Context(), id)
	if err != nil {
		logger.Error("Failed to get incident", zap.Error(err))
		http.Error(w, "Failed to retrieve incident", http.StatusInternalServerError)
		return
	}

	if incident == nil {
		http.Error(w, "Incident not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incident)
}

func UpdateIncident(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateIncidentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	incident, err := incidentService.Update(r.Context(), id, req)
	if err != nil {
		logger.Error("Failed to update incident", zap.Error(err))
		http.Error(w, "Failed to update incident", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incident)
}

func DeleteIncident(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(map[string]string{"message": "Not implemented yet"})
}

func GetIncidentTimeline(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	timeline, err := incidentService.GetTimeline(r.Context(), id)
	if err != nil {
		logger.Error("Failed to get timeline", zap.Error(err))
		http.Error(w, "Failed to retrieve timeline", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(timeline)
}

func AddTimelineEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	var event models.TimelineEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := incidentService.AddTimelineEvent(r.Context(), incidentID, event); err != nil {
		logger.Error("Failed to add timeline event", zap.Error(err))
		http.Error(w, "Failed to add timeline event", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(event)
}

// --- Service Handlers ---

func ListServices(w http.ResponseWriter, r *http.Request) {
	servs, err := serviceService.GetAll(r.Context())
	if err != nil {
		logger.Error("Failed to list services", zap.Error(err))
		http.Error(w, "Failed to retrieve services", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(servs)
}

func CreateService(w http.ResponseWriter, r *http.Request) {
	var req services.CreateServiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	service, err := serviceService.Create(r.Context(), req)
	if err != nil {
		logger.Error("Failed to create service", zap.Error(err))
		http.Error(w, "Failed to create service", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(service)
}

func GetService(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	service, err := serviceService.GetByID(r.Context(), id)
	if err != nil {
		logger.Error("Failed to get service", zap.Error(err))
		http.Error(w, "Failed to retrieve service", http.StatusInternalServerError)
		return
	}

	if service == nil {
		http.Error(w, "Service not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(service)
}

func UpdateService(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req services.UpdateServiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	service, err := serviceService.Update(r.Context(), id, req)
	if err != nil {
		logger.Error("Failed to update service", zap.Error(err))
		http.Error(w, "Failed to update service", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(service)
}

func GetServiceIncidents(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	incidents, err := serviceService.GetIncidents(r.Context(), id)
	if err != nil {
		logger.Error("Failed to get service incidents", zap.Error(err))
		http.Error(w, "Failed to retrieve incidents", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incidents)
}

// --- SLO Handlers ---

func ListSLOs(w http.ResponseWriter, r *http.Request) {
	slos, err := sloService.GetAllSLOs(r.Context())
	if err != nil {
		logger.Error("Failed to list SLOs", zap.Error(err))
		http.Error(w, "Failed to retrieve SLOs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(slos)
}

func CreateSLO(w http.ResponseWriter, r *http.Request) {
	var slo services.SLO
	if err := json.NewDecoder(r.Body).Decode(&slo); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := sloService.CreateSLO(r.Context(), &slo); err != nil {
		logger.Error("Failed to create SLO", zap.Error(err))
		http.Error(w, "Failed to create SLO", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(slo)
}

func GetSLO(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	slo, err := sloService.GetSLO(r.Context(), id)
	if err != nil {
		logger.Error("Failed to get SLO", zap.Error(err))
		http.Error(w, "Failed to retrieve SLO", http.StatusInternalServerError)
		return
	}

	if slo == nil {
		http.Error(w, "SLO not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(slo)
}

// --- Task Handlers ---

func ListTasks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	tasks, err := taskService.GetByIncidentID(r.Context(), incidentID)
	if err != nil {
		logger.Error("Failed to list tasks", zap.Error(err))
		http.Error(w, "Failed to retrieve tasks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func CreateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	var req services.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	task, err := taskService.Create(r.Context(), incidentID, req)
	if err != nil {
		logger.Error("Failed to create task", zap.Error(err))
		http.Error(w, "Failed to create task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func GetTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["task_id"]

	task, err := taskService.GetByID(r.Context(), taskID)
	if err != nil {
		logger.Error("Failed to get task", zap.Error(err))
		http.Error(w, "Failed to retrieve task", http.StatusInternalServerError)
		return
	}

	if task == nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func UpdateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["task_id"]

	var req services.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	task, err := taskService.Update(r.Context(), taskID, req)
	if err != nil {
		logger.Error("Failed to update task", zap.Error(err))
		http.Error(w, "Failed to update task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["task_id"]

	if err := taskService.Delete(r.Context(), taskID); err != nil {
		logger.Error("Failed to delete task", zap.Error(err))
		http.Error(w, "Failed to delete task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateSLO(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var slo services.SLO
	if err := json.NewDecoder(r.Body).Decode(&slo); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	slo.ID = id

	if err := sloService.UpdateSLO(r.Context(), &slo); err != nil {
		logger.Error("Failed to update SLO", zap.Error(err))
		http.Error(w, "Failed to update SLO", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(slo)
}
