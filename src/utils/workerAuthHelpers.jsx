import AsyncStorage from "@react-native-async-storage/async-storage";
import { workers } from "../data/workers";

export const findWorkerByEmail = (email) => {
  const cleanEmail = email.trim().toLowerCase();

  return workers.find(
    (worker) => worker.email.toLowerCase() === cleanEmail
  );
};

export const getWorkerPasswordKey = (workerId) => `worker_password_${workerId}`;
export const getWorkerRegisteredKey = (workerId) => `worker_registered_${workerId}`;

export const isWorkerRegistered = async (workerId) => {
  const value = await AsyncStorage.getItem(getWorkerRegisteredKey(workerId));
  return value === "true";
};

export const saveWorkerPassword = async (workerId, password) => {
  await AsyncStorage.setItem(getWorkerPasswordKey(workerId), password);
  await AsyncStorage.setItem(getWorkerRegisteredKey(workerId), "true");
};

export const verifyWorkerPassword = async (workerId, enteredPassword) => {
  const savedPassword = await AsyncStorage.getItem(getWorkerPasswordKey(workerId));
  return savedPassword === enteredPassword;
};