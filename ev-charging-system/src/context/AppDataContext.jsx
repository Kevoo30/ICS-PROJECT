import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient";
import {
  clearAuthSession,
  clearStoredCurrentUser,
  findStoredAccount,
  getAuthSession,
  getStoredCurrentUser,
  hasActiveSession,
  setAuthSession,
  setStoredCurrentUser,
  upsertStoredAccount,
} from "../services/authStorage";

const AppDataContext = createContext(null);
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function formatDateLabel(value) {
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toISOString().slice(0, 10);
}

function formatTimeLabel(value) {
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mapQueueStatus(status) {
  const dictionary = {
    waiting: "Queued",
    called: "Notified",
    charging: "Active",
    completed: "Completed",
    no_show: "Cancelled",
  };
  return dictionary[status] || "Queued";
}

async function resolveBackendUserByEmail(email) {
  return apiRequest("/auth/user-by-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function AppDataProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = getStoredCurrentUser();
    if (!storedUser) {
      return null;
    }

    if (!hasActiveSession(storedUser.uid || storedUser.id)) {
      clearStoredCurrentUser();
      clearAuthSession();
      return null;
    }

    return storedUser;
  });
  const [ports, setPorts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [queueEntries, setQueueEntries] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [userNamesById, setUserNamesById] = useState({});
  const [vehicleNamesById, setVehicleNamesById] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [latenessAppeals, setLatenessAppeals] = useState(() => {
    try {
      const raw = localStorage.getItem("ev_lateness_appeals");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("ev_lateness_appeals", JSON.stringify(latenessAppeals));
  }, [latenessAppeals]);

  const addNotification = useCallback((message, type = "info") => {
    const notice = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
    };
    setAlerts((current) => [notice, ...current].slice(0, 8));
  }, []);

  const dismissNotification = useCallback((id) => {
    setAlerts((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const loadDashboardData = useCallback(async (user) => {
    const uid = user?.uid || user?.id || null;

    if (!uid) {
      setUserBookings([]);
      setUserSessions([]);
      setVehicles([]);
      setUserNamesById({});
      setViolations([]);
    }

    const portsResponse = await apiRequest("/ports/");
    const safePorts = Array.isArray(portsResponse) ? portsResponse : [];
    setPorts(safePorts);

    if (uid) {
      const [bookingsResponse, sessionsResponse, vehiclesResponse] = await Promise.all([
        apiRequest(`/bookings/user/${uid}`),
        apiRequest(`/sessions/user/${uid}`),
        apiRequest(`/auth/user/${uid}/vehicles`).catch(() => []),
      ]);

      setUserBookings(Array.isArray(bookingsResponse) ? bookingsResponse : []);
      setUserSessions(Array.isArray(sessionsResponse) ? sessionsResponse : []);
      setVehicles(Array.isArray(vehiclesResponse) ? vehiclesResponse : []);
    }

    const queuePerPort = await Promise.all(
      safePorts.map((port) => apiRequest(`/queue/port/${port.port_id}`).catch(() => [])),
    );
    const sessionPerPort = await Promise.all(
      safePorts.map((port) => apiRequest(`/sessions/port/${port.port_id}`).catch(() => [])),
    );

    const mergedQueue = queuePerPort.flat().filter(Boolean);
    const mergedSessions = sessionPerPort.flat().filter(Boolean);

    setQueueEntries(mergedQueue);
    setAllSessions(mergedSessions);

    const uniqueUserIds = [
      ...new Set([
        ...mergedQueue.map((item) => item.user_id),
        ...mergedSessions.map((item) => item.user_id),
        uid,
      ].filter(Boolean)),
    ];

    const userResults = await Promise.all(
      uniqueUserIds.map((uid) =>
        apiRequest(`/auth/user/${uid}`)
          .then((userDetails) => ({ uid, name: userDetails?.name || uid }))
          .catch(() => ({ uid, name: uid })),
      ),
    );

    setUserNamesById(
      userResults.reduce((acc, item) => {
        acc[item.uid] = item.name;
        return acc;
      }, {}),
    );

    const vehiclesByUser = await Promise.all(
      uniqueUserIds.map((id) => apiRequest(`/auth/user/${id}/vehicles`).catch(() => [])),
    );

    const vehicleLookup = vehiclesByUser
      .flat()
      .filter(Boolean)
      .reduce((acc, vehicle) => {
        if (vehicle?.vehicle_id) {
          acc[vehicle.vehicle_id] = vehicle.vehicle_model || vehicle.number_plate || vehicle.vehicle_id;
        }
        return acc;
      }, {});

    setVehicleNamesById(vehicleLookup);

    const violationsByUser = await Promise.all(
      uniqueUserIds.map((id) => apiRequest(`/violations/user/${id}`).catch(() => [])),
    );

    const flattenedViolations = violationsByUser.flat().filter(Boolean);
    const uniqueViolations = Array.from(
      new Map(flattenedViolations.map((item) => [item.violation_id, item])).values(),
    );
    setViolations(uniqueViolations);
  }, []);

  useEffect(() => {
    loadDashboardData(currentUser).catch((error) => {
      addNotification(`Failed to refresh data: ${error.message}`, "warning");
    });
  }, [addNotification, currentUser, loadDashboardData]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const session = getAuthSession();
    const uid = currentUser.uid || currentUser.id;
    if (!session || session.uid !== uid) {
      clearStoredCurrentUser();
      clearAuthSession();
      setCurrentUser(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const timer = setInterval(() => {
      const uid = currentUser.uid || currentUser.id;
      if (!hasActiveSession(uid)) {
        clearStoredCurrentUser();
        clearAuthSession();
        setCurrentUser(null);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [currentUser]);

  const ensureDefaultVehicle = useCallback(async (uid, connectorType = "Type 2") => {
    const vehicles = await apiRequest(`/auth/user/${uid}/vehicles`);
    const availableVehicles = Array.isArray(vehicles) ? vehicles : [];

    if (availableVehicles.length > 0) {
      const preferred = availableVehicles.find((item) => item.is_default) || availableVehicles[0];
      return preferred.vehicle_id;
    }

    const fallbackPlate = `EV-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await apiRequest(`/auth/user/${uid}/vehicles`, {
      method: "POST",
      body: JSON.stringify({
        vehicle_model: "EV Model",
        number_plate: fallbackPlate,
        connector_type: connectorType,
      }),
    });

    return created.vehicle_id;
  }, []);

  const registerUser = useCallback(
    async ({ fullName, email, phone, password, role = "driver", vehicleModel, numberPlate, connectorType }) => {
      try {
        const registerResult = await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            name: fullName,
            phone,
            role,
            vehicle_model: vehicleModel,
            number_plate: numberPlate,
            connector_type: connectorType || "Type 2",
          }),
        });

        const uid = registerResult?.uid;
        if (!uid) {
          throw new Error("Registration succeeded but no user id was returned.");
        }

        upsertStoredAccount({ email, password, uid, role });
        const backendUser = await apiRequest(`/auth/user/${uid}`);
        setStoredCurrentUser(backendUser);
        setAuthSession(backendUser);
        setCurrentUser(backendUser);
        addNotification("Account created and synced with backend.", "success");
        return backendUser;
      } catch (error) {
        const message = String(error?.message || "");
        if (message.includes("EMAIL_EXISTS") || message.toLowerCase().includes("already exists")) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }
        throw error;
      }
    },
    [addNotification],
  );

  const loginUser = useCallback(async (email, password) => {
    const account = findStoredAccount(email, password);
    let backendUser;

    if (account?.uid) {
      backendUser = await apiRequest(`/auth/user/${account.uid}`);
    } else {
      backendUser = await resolveBackendUserByEmail(email);
      if (!backendUser?.uid) {
        throw new Error("Unable to find this account in the backend. Please register first.");
      }

      upsertStoredAccount({
        email,
        password,
        uid: backendUser.uid,
        role: backendUser.role || "driver",
      });
    }

    setStoredCurrentUser(backendUser);
    setAuthSession(backendUser);
    setCurrentUser(backendUser);
    return backendUser;
  }, []);

  const logoutUser = useCallback(() => {
    clearAuthSession();
    clearStoredCurrentUser();
    setCurrentUser(null);
    setAlerts([]);
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const backendUser = await loginUser(email, password);
        return {
          ok: true,
          user: {
            ...backendUser,
            id: backendUser?.uid || backendUser?.id,
          },
        };
      } catch (error) {
        return { ok: false, error: error.message || "Invalid credentials" };
      }
    },
    [loginUser],
  );

  const logout = useCallback(() => {
    logoutUser();
  }, [logoutUser]);

  const registerUserCompat = useCallback(
    async ({ name, email, password, role = "driver", vehicle }) => {
      try {
        const vehicleModel = vehicle
          ? [vehicle.make, vehicle.model].filter(Boolean).join(" ").trim() || "EV Model"
          : "EV Model";
        const numberPlate = vehicle?.plate || `EV-${Math.floor(1000 + Math.random() * 9000)}`;
        const backendUser = await registerUser({
          fullName: name,
          email,
          phone: "N/A",
          password,
          role,
          vehicleModel,
          numberPlate,
          connectorType: "Type 2",
        });
        return {
          ok: true,
          user: {
            ...backendUser,
            id: backendUser?.uid || backendUser?.id,
          },
        };
      } catch (error) {
        return { ok: false, error: error.message || "Unable to register." };
      }
    },
    [registerUser],
  );

  const createBooking = useCallback(
    async (payload) => {
      const currentUid = currentUser?.uid || currentUser?.id;
      if (!currentUid) {
        throw new Error("Please log in first.");
      }

      const stationId = payload?.port_id || payload?.stationId;
      const selectedVehicleId = payload?.vehicle_id || payload?.vehicleId;
      const isPriority =
        typeof payload?.is_priority === "boolean"
          ? payload.is_priority
          : false;
      const batteryLevelValue =
        payload?.battery_level ?? payload?.batteryLevel ?? payload?.batteryPercentage;
      const preferredTime = payload?.preferred_time ?? payload?.preferredTime ?? null;

      const selectedPort = ports.find((port) => port.port_id === stationId);
      if (!selectedPort) {
        throw new Error("Select a valid charging port.");
      }

      const vehicleId =
        selectedVehicleId ||
        (await ensureDefaultVehicle(currentUid, selectedPort.connector_type || "Type 2"));

      const batteryLevel =
        batteryLevelValue === null || batteryLevelValue === undefined || batteryLevelValue === ""
          ? null
          : Number(batteryLevelValue);

      if (isPriority && (Number.isNaN(batteryLevel) || batteryLevel < 1 || batteryLevel > 100)) {
        throw new Error("Battery level must be between 1 and 100 for priority bookings.");
      }

      const bookingResult = await apiRequest("/bookings/", {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUid,
          vehicle_id: vehicleId,
          port_id: stationId,
          is_priority: isPriority,
          battery_level: isPriority ? batteryLevel : null,
          preferred_time: preferredTime,
        }),
      });

      const bookingId = bookingResult?.booking_id;
      if (!bookingId) {
        throw new Error("Booking was created but no booking id was returned.");
      }

      await apiRequest("/queue/join", {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUid,
          vehicle_id: vehicleId,
          booking_id: bookingId,
          port_id: stationId,
          entry_type: "booking",
          is_priority: isPriority,
          battery_level: isPriority ? batteryLevel : null,
          preferred_time: preferredTime,
        }),
      });

      addNotification("Booking created and queued successfully.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, ensureDefaultVehicle, loadDashboardData, ports],
  );

  const startCharging = useCallback(
    async (entryId) => {
      const entry = queueEntries.find((item) => item.entry_id === entryId);
      if (!entry) {
        throw new Error("Queue entry not found.");
      }

      await apiRequest("/sessions/start", {
        method: "POST",
        body: JSON.stringify({
          user_id: entry.user_id,
          vehicle_id: entry.vehicle_id,
          port_id: entry.port_id,
          queue_entry_id: entry.entry_id,
        }),
      });

      addNotification("Charging session started.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData, queueEntries],
  );

  const completeSession = useCallback(
    async (sessionId) => {
      await apiRequest(`/sessions/${sessionId}/end`, {
        method: "PUT",
      });
      addNotification("Charging session completed.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const cancelBooking = useCallback(
    async (entryId) => {
      const entry = queueEntries.find((item) => item.entry_id === entryId);
      if (!entry) {
        throw new Error("Queue entry not found.");
      }

      if (entry.booking_id) {
        try {
          await apiRequest(`/bookings/${entry.booking_id}/cancel`, {
            method: "PUT",
            body: JSON.stringify({
              cancelled_by: "operator",
            }),
          });
        } catch (error) {
          addNotification(error.message || "Booking status was not updated.", "warning");
        }
      }

      await apiRequest(`/queue/${entryId}/noshow`, {
        method: "PUT",
      });
      addNotification("Queue entry marked as no-show.", "warning");

      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData, queueEntries],
  );

  const cancelUserBooking = useCallback(
    async (bookingId) => {
      await apiRequest(`/bookings/${bookingId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ cancelled_by: "driver" }),
      });
      addNotification("Booking cancelled.", "warning");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const delayQueueEntry = useCallback(
    async (entryId) => {
      await apiRequest(`/queue/${entryId}/delay`, { method: "PUT" });
      addNotification("Queue position delayed by one slot.", "info");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const markQueueNoShow = useCallback(
    async (entryId) => {
      await apiRequest(`/queue/${entryId}/noshow`, { method: "PUT" });
      addNotification("Queue entry removed.", "warning");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const addVehicle = useCallback(
    async ({ vehicleModel, numberPlate, connectorType }) => {
      const currentUid = currentUser?.uid || currentUser?.id;
      if (!currentUid) {
        throw new Error("Please log in first.");
      }

      await apiRequest(`/auth/user/${currentUid}/vehicles`, {
        method: "POST",
        body: JSON.stringify({
          vehicle_model: vehicleModel,
          number_plate: numberPlate,
          connector_type: connectorType,
        }),
      });
      addNotification("Vehicle added.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const setDefaultVehicle = useCallback(
    async (vehicleId) => {
      const currentUid = currentUser?.uid || currentUser?.id;
      if (!currentUid) {
        throw new Error("Please log in first.");
      }

      await apiRequest(`/auth/user/${currentUid}/vehicles/${vehicleId}/default`, {
        method: "PUT",
      });
      addNotification("Default vehicle updated.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const deleteVehicle = useCallback(
    async (vehicleId) => {
      const currentUid = currentUser?.uid || currentUser?.id;
      if (!currentUid) {
        throw new Error("Please log in first.");
      }

      await apiRequest(`/auth/user/${currentUid}/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      addNotification("Vehicle deleted.", "warning");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const addVehicleCompat = useCallback(
    async (arg1, arg2) => {
      if (arg2) {
        const vehicle = arg2;
        await addVehicle({
          vehicleModel: [vehicle.make, vehicle.model].filter(Boolean).join(" ").trim() || "EV Model",
          numberPlate: vehicle.plate || vehicle.numberPlate || `EV-${Math.floor(1000 + Math.random() * 9000)}`,
          connectorType: vehicle.connectorType || "Type 2",
        });
        return;
      }

      await addVehicle(arg1);
    },
    [addVehicle],
  );

  const removeVehicle = useCallback(
    async (userId, vehicleId) => {
      const idToDelete = vehicleId || userId;
      await deleteVehicle(idToDelete);
    },
    [deleteVehicle],
  );

  const joinQueue = useCallback(
    async (stationId, vehicleId, batteryLevel, isEmergency = false) => {
      try {
        await createBooking({
          stationId,
          vehicleId,
          is_priority: isEmergency,
          batteryLevel,
        });
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message || "Unable to join queue." };
      }
    },
    [createBooking],
  );

  const submitAppeal = useCallback((userId, reason) => {
    setLatenessAppeals((current) => ({
      ...current,
      [userId]: {
        reason,
        submittedAt: new Date().toISOString(),
      },
    }));
    return { ok: true };
  }, []);

  const submitNoShowReason = useCallback(
    async (entryId, reason) => {
      const trimmedReason = String(reason || "").trim();
      if (!entryId) {
        throw new Error("Queue entry id is required.");
      }
      if (!trimmedReason) {
        throw new Error("Please provide a reason.");
      }

      const currentUid = currentUser?.uid || currentUser?.id;
      const pendingViolation = violations
        .filter(
          (item) =>
            item.user_id === currentUid &&
            item.status === "pending" &&
            item.is_deleted !== true &&
            item.reason === "No show at charging port" &&
            !item.no_show_reason,
        )
        .sort((a, b) => new Date(b.no_show_at || b.created_at || 0) - new Date(a.no_show_at || a.created_at || 0))[0];

      if (!pendingViolation?.violation_id) {
        throw new Error("No pending no-show violation found to submit a reason for.");
      }

      await apiRequest(`/violations/${pendingViolation.violation_id}/reason`, {
        method: "PUT",
        body: JSON.stringify({
          reason: trimmedReason,
        }),
      });

      addNotification("Reason submitted for operator review.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData, violations],
  );

  const updatePortStatus = useCallback(
    async (portId, status) => {
      await apiRequest(`/ports/${portId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      addNotification(`Port status changed to ${status}.`, "info");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const issueViolation = useCallback(
    async ({ userId, reason, issuedBy = "operator" }) => {
      await apiRequest("/violations/", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          reason,
          issued_by: issuedBy,
        }),
      });
      addNotification("Violation issued.", "warning");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const liftViolation = useCallback(
    async (violationId) => {
      await apiRequest(`/violations/${violationId}`, { method: "DELETE" });
      addNotification("Violation lifted.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const reviewViolation = useCallback(
    async ({ violationId, action, reviewedBy }) => {
      if (!violationId) {
        throw new Error("Violation id is required.");
      }

      if (action !== "keep" && action !== "discard") {
        throw new Error("Action must be keep or discard.");
      }

      const operatorId = reviewedBy || currentUser?.uid || currentUser?.id;
      if (!operatorId) {
        throw new Error("Operator id is required.");
      }

      await apiRequest(`/violations/${violationId}/review`, {
        method: "PUT",
        body: JSON.stringify({
          action,
          operator_id: operatorId,
          reviewed_by: operatorId,
        }),
      });

      addNotification(
        action === "discard" ? "Violation discarded." : "Violation kept.",
        action === "discard" ? "success" : "warning",
      );
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, loadDashboardData],
  );

  const value = useMemo(() => {
    const currentUid = currentUser?.uid || currentUser?.id;

    const stations = ports.map((port, index) => ({
      id: port.port_id,
      name: port.port_name || `Charging Port ${index + 1}`,
      location: "-",
      distance: "-",
      totalPorts: 1,
      connectorType: port.connector_type,
      status: port.status,
    }));

    const portNameById = ports.reduce((acc, port, index) => {
      acc[port.port_id] = port.port_name || `Charging Port ${index + 1}`;
      return acc;
    }, {});

    const myQueueEntry = queueEntries.find((item) => item.user_id === currentUid) || null;

    const queueDisplay = queueEntries
      .slice()
      .sort((a, b) => Number(a.queue_position || 999) - Number(b.queue_position || 999))
      .map((item) => ({
        ...item,
        user_name: userNamesById[item.user_id] || item.user_id,
        vehicle_model: item.vehicle_model || vehicleNamesById[item.vehicle_id] || item.vehicle_id,
        port_name: portNameById[item.port_id] || item.port_id,
      }));

    const sessionsDisplay = allSessions
      .filter((item) => item.status === "active")
      .map((item) => ({
        ...item,
        user_name: userNamesById[item.user_id] || item.user_id,
        vehicle_model: item.vehicle_model || vehicleNamesById[item.vehicle_id] || item.vehicle_id,
        port_name: portNameById[item.port_id] || item.port_id,
        start_time: formatTimeLabel(item.start_time),
      }));

    const bookingsDisplay = userBookings.map((item) => ({
      ...item,
      created_at: formatDateLabel(item.created_at),
    }));

    const violationsDisplay = violations
      .slice()
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .map((item) => ({
        ...item,
        user_name: userNamesById[item.user_id] || item.user_id,
      }));

    const pendingViolations = violationsDisplay.filter(
      (item) => item.status === "pending" && item.is_deleted !== true,
    );

    const queueBookings = queueEntries
      .filter((item) => item.status === "waiting" || item.status === "called")
      .sort((a, b) => {
        const batteryA = Number(a.battery_level ?? 999);
        const batteryB = Number(b.battery_level ?? 999);
        if (batteryA !== batteryB) {
          return batteryA - batteryB;
        }
        return Number(a.queue_position || 999) - Number(b.queue_position || 999);
      })
      .map((item, index) => ({
        id: item.entry_id,
        bookingId: item.booking_id || null,
        priority: index + 1,
        driverName: userNamesById[item.user_id] || item.user_id,
        batteryPercentage: Number(item.battery_level ?? 0),
        stationName: portNameById[item.port_id] || item.port_id,
        port: portNameById[item.port_id] || item.port_id,
        date: formatDateLabel(item.arrived_at),
        timeSlot: formatTimeLabel(item.arrived_at),
        status: mapQueueStatus(item.status),
      }));

    const activeSessions = allSessions
      .filter((item) => item.status === "active")
      .map((item) => ({
        id: item.session_id,
        driverName: userNamesById[item.user_id] || item.user_id,
        stationName: portNameById[item.port_id] || item.port_id,
        port: portNameById[item.port_id] || item.port_id,
        batteryPercentage: 0,
        date: formatDateLabel(item.start_time),
        timeSlot: formatTimeLabel(item.start_time),
      }));

    const completedSessions = allSessions
      .filter((item) => item.status === "completed")
      .sort((a, b) => new Date(b.end_time || b.updated_at || 0) - new Date(a.end_time || a.updated_at || 0))
      .map((item) => ({
        id: item.session_id,
        driverName: userNamesById[item.user_id] || item.user_id,
        stationName: portNameById[item.port_id] || item.port_id,
        port: portNameById[item.port_id] || item.port_id,
        energyUsed: item.duration_minutes || 0,
      }));

    const stationsWithAvailability = stations.map((station) => {
      const activeAtStation = activeSessions.filter((session) => session.stationName === station.name).length;
      const waitingAtStation = queueBookings.filter((item) => item.stationName === station.name).length;
      const availablePorts = station.status === "available" ? 1 : 0;

      return {
        ...station,
        activePorts: activeAtStation,
        waitingVehicles: waitingAtStation,
        availablePorts,
      };
    });

    const totalAvailablePorts = stationsWithAvailability.reduce(
      (sum, station) => sum + Number(station.availablePorts || 0),
      0,
    );

    const driverRecentSessions = userSessions
      .filter((item) => item.status === "active" || item.status === "completed")
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 8)
      .map((item) => ({
        id: item.session_id,
        station: portNameById[item.port_id] || item.port_id,
        port: portNameById[item.port_id] || item.port_id,
        time: formatTimeLabel(item.start_time),
        status: item.status === "active" ? "Active" : "Completed",
      }));

    const driverStats = {
      activeBookings: queueEntries.filter(
        (item) => item.user_id === currentUid && (item.status === "waiting" || item.status === "called"),
      ).length,
      completedSessions: userSessions.filter((item) => item.status === "completed").length,
      energyUsed: Number(
        userSessions
          .filter((item) => item.status === "completed")
          .reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0)
          .toFixed(1),
      ),
      savedCo2: Number(
        (
          userSessions
            .filter((item) => item.status === "completed")
            .reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0) * 0.28
        ).toFixed(1),
      ),
    };

    const nearbyStations = stationsWithAvailability.map((station) => ({
      name: station.name,
      distance: "-",
      availability: `${station.availablePorts} ports available`,
    }));

    const vehiclesCompat = vehicles.map((item) => ({
      id: item.vehicle_id,
      make: item.vehicle_model,
      model: "",
      plate: item.number_plate,
      batteryCapacity: null,
    }));

    const currentUserCompat = currentUser
      ? {
          ...currentUser,
          id: currentUser.uid || currentUser.id,
          vehicles: vehiclesCompat,
          banned: (() => {
            const serverBan = Boolean(currentUser.is_banned);
            const inferredBan = violationsDisplay.some(
              (item) =>
                item.user_id === (currentUser.uid || currentUser.id) &&
                item.is_deleted !== true &&
                Date.now() - new Date(item.no_show_at || item.created_at || 0).getTime() >= TWO_HOURS_MS,
            );
            return serverBan || inferredBan;
          })(),
          banStart:
            currentUser.ban_start ||
            violationsDisplay
              .filter(
                (item) =>
                  item.user_id === (currentUser.uid || currentUser.id) &&
                  item.is_deleted !== true,
              )
              .map((item) => item.no_show_at || item.created_at)
              .filter(Boolean)
              .sort()[0] ||
            null,
        }
      : null;

    const bookingsCompat = queueEntries
      .filter((item) => item.user_id === currentUid)
      .map((item) => ({
        id: item.entry_id,
        userId: item.user_id,
        userName: userNamesById[item.user_id] || item.user_id,
        stationId: item.port_id,
        vehicleId: item.vehicle_id,
        batteryLevel: Number(item.battery_level ?? 0),
        emergency: Boolean(item.is_priority),
        priority: Boolean(item.is_priority),
        status: item.status,
        joinedAt: item.arrived_at,
      }));

    return {
      currentUser: currentUserCompat,
      currentDriver: currentUser?.name || "Driver",
      currentRole: currentUser?.role || "driver",
      stations,
      ports,
      vehicles,
      bookings: bookingsCompat,
      bookingsDisplay,
      queueEntries,
      queueDisplay,
      myQueueEntry,
      sessionsDisplay,
      violations: violationsDisplay,
      pendingViolations,
      queueBookings,
      activeSessions,
      completedSessions,
      stationsWithAvailability,
      totalAvailablePorts,
      appAlerts: alerts,
      dismissNotification,
      createBooking,
      cancelUserBooking,
      delayQueueEntry,
      markQueueNoShow,
      addVehicle: addVehicleCompat,
      removeVehicle,
      setDefaultVehicle,
      deleteVehicle,
      updatePortStatus,
      issueViolation,
      liftViolation,
      reviewViolation,
      joinQueue,
      submitAppeal,
      submitNoShowReason,
      latenessAppeals,
      startCharging,
      completeSession,
      cancelBooking,
      driverStats,
      driverRecentSessions,
      nearbyStations,
      registerUser: registerUserCompat,
      login,
      logout,
      loginUser,
      logoutUser,
      refreshData: () => loadDashboardData(currentUser),
    };
  }, [
    cancelBooking,
    cancelUserBooking,
    completeSession,
    createBooking,
    currentUser,
    delayQueueEntry,
    dismissNotification,
    issueViolation,
    liftViolation,
    reviewViolation,
    joinQueue,
    latenessAppeals,
    login,
    markQueueNoShow,
    loadDashboardData,
    loginUser,
    logout,
    vehicleNamesById,
    vehicles,
    alerts,
    ports,
    queueEntries,
    violations,
    registerUser,
    registerUserCompat,
    removeVehicle,
    addVehicle,
    addVehicleCompat,
    submitAppeal,
    submitNoShowReason,
    setDefaultVehicle,
    deleteVehicle,
    startCharging,
    updatePortStatus,
    allSessions,
    userBookings,
    userNamesById,
    userSessions,
    logoutUser,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
