import type { ApiResponse, BackendHolding } from "@/types/api";
import { Holding } from "@/types/holding";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Transforms backend holding to client holding type
 */
const transformHolding = (backendHolding: BackendHolding): Holding => ({
  id: backendHolding.id,
  ticker: backendHolding.ticker,
  quantity: backendHolding.quantity,
  price: backendHolding.price,
  date: backendHolding.date,
});

/**
 * Fetches all holdings for the authenticated user
 */
export const fetchHoldings = async (): Promise<Holding[]> => {
  const response = await fetch(`${BACKEND_URL}/holdings`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  
  const data: ApiResponse<BackendHolding[] | null> = await response.json();
  
  if (data.status !== "success") {
    throw new Error(data.error || "Failed to fetch holdings");
  }
  
  return (data.response || []).map(transformHolding);
};

/**
 * Creates a new holding for the authenticated user
 */
export const createHolding = async (holding: Omit<Holding, "id">): Promise<Holding> => {
  const response = await fetch(`${BACKEND_URL}/holdings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(holding),
  });
  
  const data: ApiResponse<BackendHolding> = await response.json();
  
  if (data.status !== "success") {
    throw new Error(data.error || "Failed to create holding");
  }
  
  return transformHolding(data.response);
};

/**
 * Updates an existing holding
 */
export const updateHolding = async (holding: Holding): Promise<Holding> => {
  const response = await fetch(`${BACKEND_URL}/holdings/${holding.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(holding),
  });
  
  const data: ApiResponse<BackendHolding> = await response.json();
  
  if (data.status !== "success") {
    throw new Error(data.error || "Failed to update holding");
  }
  
  return transformHolding(data.response);
};

/**
 * Deletes a holding by ID
 */
export const deleteHolding = async (id: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/holdings/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  
  const data: ApiResponse<{ message: string }> = await response.json();
  
  if (data.status !== "success") {
    throw new Error(data.error || "Failed to delete holding");
  }
};
