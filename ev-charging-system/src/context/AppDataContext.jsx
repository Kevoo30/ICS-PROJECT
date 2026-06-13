import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient";
import {
  clearStoredCurrentUser,
  findStoredAccount,
  getStoredCurrentUser,
  setStoredCurrentUser,
  upsertStoredAccount,
} from "../services/authStorage";

const AppDataContext = createContext(null);

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

export function AppDataProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredCurrentUser());
  const [ports, setPorts] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [queueEntries, setQueueEntries] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [userNamesById, setUserNamesById] = useState({});
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "info") => {
    const notice = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
    };
    setNotifications((current) => [notice, ...current].slice(0, 8));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const loadDashboardData = useCallback(async (user) => {
    if (!user?.uid) {
      setPorts([]);
      setUserBookings([]);
      setUserSessions([]);
      setQueueEntries([]);
      setAllSessions([]);
      setUserNamesById({});
      return;
    }

    const portsResponse = await apiRequest("/ports/");
    const safePorts = Array.isArray(portsResponse) ? portsResponse : [];
    setPorts(safePorts);

    const [bookingsResponse, sessionsResponse] = await Promise.all([
      apiRequest(`/bookings/user/${user.uid}`),
      apiRequest(`/sessions/user/${user.uid}`),
    ]);

    setUserBookings(Array.isArray(bookingsResponse) ? bookingsResponse : []);
    setUserSessions(Array.isArray(sessionsResponse) ? sessionsResponse : []);

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

    const uniqueUserIds = [...new Set([...mergedQueue, ...mergedSessions].map((item) => item.user_id).filter(Boolean))];
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
  }, []);

  useEffect(() => {
    loadDashboardData(currentUser).catch((error) => {
      addNotification(`Failed to refresh data: ${error.message}`, "warning");
    });
  }, [addNotification, currentUser, loadDashboardData]);

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
      const registerResult = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: fullName,
          phone,
          role,
        }),
      });

      const uid = registerResult?.uid;
      if (!uid) {
        throw new Error("Registration succeeded but no user id was returned.");
      }

      await apiRequest(`/auth/user/${uid}/vehicles`, {
        method: "POST",
        body: JSON.stringify({
          vehicle_model: vehicleModel || "EV Model",
          number_plate: numberPlate || `EV-${Math.floor(1000 + Math.random() * 9000)}`,
          connector_type: connectorType || "Type 2",
        }),
      });

      upsertStoredAccount({ email, password, uid, role });
      const backendUser = await apiRequest(`/auth/user/${uid}`);
      setStoredCurrentUser(backendUser);
      setCurrentUser(backendUser);
      addNotification("Account created and synced with backend.", "success");
      return backendUser;
    },
    [addNotification],
  );

  const loginUser = useCallback(async (email, password) => {
    const account = findStoredAccount(email, password);
    if (!account) {
      throw new Error("Account not found in this browser. Register first on this device.");
    }

    const backendUser = await apiRequest(`/auth/user/${account.uid}`);
    setStoredCurrentUser(backendUser);
    setCurrentUser(backendUser);
    addNotification("Login successful.", "success");
    return backendUser;
  }, [addNotification]);

  const logoutUser = useCallback(() => {
    clearStoredCurrentUser();
    setCurrentUser(null);
    setNotifications([]);
  }, []);

  const createBooking = useCallback(
    async ({ stationId, batteryPercentage }) => {
      if (!currentUser?.uid) {
        throw new Error("Please log in first.");
      }

      const selectedPort = ports.find((port) => port.port_id === stationId);
      if (!selectedPort) {
        throw new Error("Select a valid charging port.");
      }

      const vehicleId = await ensureDefaultVehicle(currentUser.uid, selectedPort.connector_type || "Type 2");

      const bookingResult = await apiRequest("/bookings/", {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUser.uid,
          vehicle_id: vehicleId,
          port_id: stationId,
          is_priority: true,
          battery_level: Number(batteryPercentage),
        }),
      });

      const bookingId = bookingResult?.booking_id;
      if (!bookingId) {
        throw new Error("Booking was created but no booking id was returned.");
      }

      await apiRequest("/queue/join", {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUser.uid,
          vehicle_id: vehicleId,
          booking_id: bookingId,
          port_id: stationId,
          entry_type: "booking",
          is_priority: true,
          battery_level: Number(batteryPercentage),
        }),
      });

      addNotification("Booking created and queued successfully.", "success");
      await loadDashboardData(currentUser);
    },
    [addNotification, currentUser, ensureDefaultVehicle, loadDashboardData, ports],
  );

  const notifyBooking = useCallback(
    async (entryId) => {
      const entry = queueEntries.find((item) => item.entry_id === entryId);
      if (!entry) {
        throw new Error("Queue entry not found.");
      }

      await apiRequest("/notifications/", {
        method: "POST",
        body: JSON.stringify({
          user_id: entry.user_id,
          type: "queue_update",
          message: "Your charging slot is almost ready.",
          sent_via: "in_app",
        }),
      });

      addNotification("Driver notification sent.", "info");
    },
    [addNotification, queueEntries],
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

  const value = useMemo(() => {
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
        (item) => item.user_id === currentUser?.uid && (item.status === "waiting" || item.status === "called"),
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

    return {
      currentUser,
      currentDriver: currentUser?.name || "Driver",
      stations,
      bookings: userBookings,
      queueBookings,
      activeSessions,
      completedSessions,
      stationsWithAvailability,
      totalAvailablePorts,
      notifications,
      dismissNotification,
      createBooking,
      notifyBooking,
      startCharging,
      completeSession,
      cancelBooking,
      driverStats,
      driverRecentSessions,
      nearbyStations,
      registerUser,
      loginUser,
      logoutUser,
      refreshData: () => loadDashboardData(currentUser),
    };
  }, [
    cancelBooking,
    completeSession,
    createBooking,
    currentUser,
    dismissNotification,
    loadDashboardData,
    loginUser,
    notifications,
    notifyBooking,
    ports,
    queueEntries,
    registerUser,
    startCharging,
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
